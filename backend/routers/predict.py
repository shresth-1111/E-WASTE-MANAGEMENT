from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from services.model_service import model_service
from models.schemas import PredictionResponse
from utils.auth import verify_token, db
from typing import Dict, Any
from PIL import Image
import io
import numpy as np
import math

router = APIRouter()

def haversine_distance(lat1, lon1, lat2, lon2):
    # Returns distance in meters
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def categorize_waste(label: str, confidence: float):
    """Categorize e-waste and estimate weight based on detected label"""
    label_lower = label.lower()
    
    # E-waste categories with weight ranges (min, max in kg)
    categories = {
        "mobile": {
            "keywords": ["mobile", "phone", "smartphone", "cell"],
            "weight_range": (0.15, 0.25),
            "base_stars": 2.5,
            "recyclability": "recyclable"
        },
        "laptop": {
            "keywords": ["laptop", "notebook", "computer"],
            "weight_range": (1.5, 3.0),
            "base_stars": 3.5,
            "recyclability": "recyclable"
        },
        "charger": {
            "keywords": ["charger", "adapter", "cable", "cord"],
            "weight_range": (0.05, 0.15),
            "base_stars": 1.5,
            "recyclability": "recyclable"
        },
        "battery": {
            "keywords": ["battery", "cell"],
            "weight_range": (0.02, 0.5),
            "base_stars": 2.0,
            "recyclability": "partially_damaged"
        },
        "monitor": {
            "keywords": ["monitor", "screen", "display", "tv", "television"],
            "weight_range": (3.0, 10.0),
            "base_stars": 4.5,
            "recyclability": "recyclable"
        },
        "printer": {
            "keywords": ["printer", "scanner"],
            "weight_range": (5.0, 15.0),
            "base_stars": 4.5,
            "recyclability": "recyclable"
        },
        "mixed": {
            "keywords": ["electronic", "device", "plastic", "waste", "trash", "mixed"],
            "weight_range": (0.5, 2.0),
            "base_stars": 2.0,
            "recyclability": "recyclable"
        }
    }
    
    # Match label to category
    for category, data in categories.items():
        for keyword in data["keywords"]:
            if keyword in label_lower:
                # Estimate weight (average with slight randomness based on confidence)
                weight_min, weight_max = data["weight_range"]
                estimated_weight = weight_min + (weight_max - weight_min) * confidence
                return category, estimated_weight, data["base_stars"], data["recyclability"]
    
    # Unknown/not e-waste
    return "unknown", 0.0, 0.0, "unknown"


def calculate_rating(waste_category: str, estimated_weight: float, clarity: float, confidence: float, base_stars: float):
    """Calculate rating based on waste value, weight, clarity, and confidence"""
    
    if waste_category == "unknown" or confidence < 0.35:
        # Not e-waste or too low confidence
        return 0
    
    # Start with base stars for waste type
    rating = base_stars
    
    # Weight contribution
    if estimated_weight >= 5.0:
        rating += 1.5
    elif estimated_weight >= 1.0:
        rating += 1.0
    elif estimated_weight >= 0.1:
        rating += 0.5
    
    # Image quality (clarity)
    if clarity < 0.2:
        rating -= 1.0  # Poor quality penalty
    elif clarity > 0.4:
        rating += 0.5  # Good quality bonus
    
    # Confidence multiplier
    if confidence < 0.6:
        rating *= 0.7  # Fair confidence
    elif confidence < 0.8:
        rating *= 0.85  # Good confidence
    # Otherwise 100% (excellent confidence)
    
    # Clamp to 0-5 range and round
    rating = max(0, min(5, round(rating)))
    
    # Deny if rating < 1
    if rating < 1:
        return 0
    
    return int(rating)


@router.post("/predict", response_model=PredictionResponse)
async def predict_image(
    file: UploadFile = File(...),
    bin_id: str = Form(...),
    user_lat: float = Form(...),
    user_lng: float = Form(...),
    user: Dict[str, Any] = Depends(verify_token)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Get bin info
    bin_doc = db.collection("bins").document(bin_id).get()
    if not bin_doc.exists:
        raise HTTPException(status_code=404, detail="Selected bin not found")

    bin_data = bin_doc.to_dict()
    bin_lat = float(bin_data.get("latitude"))
    bin_lng = float(bin_data.get("longitude"))

    # Compute distance
    distance = haversine_distance(user_lat, user_lng, bin_lat, bin_lng)
    allowed_radius = 30.0  # meters
    if distance > allowed_radius:
        raise HTTPException(
            status_code=403, 
            detail=f"You are not near a bin. You must be within {allowed_radius}m of a registered bin to submit waste. Current distance: {distance:.1f}m"
        )

    try:
        data = await file.read()

        # Basic clarity metric: variance of grayscale image normalized
        try:
            img = Image.open(io.BytesIO(data)).convert('L')
            arr = np.array(img).astype(np.float32)
            clarity = float(np.var(arr) / (255.0**2))  # roughly 0-1
        except Exception:
            clarity = 0.0

        # Reject very blurry images
        if clarity < 0.15:
            return PredictionResponse(
                label="Unknown",
                confidence=0.0,
                all_predictions={},
                rating=0,
                message="Image quality too poor. Please take a clearer photo.",
                denial_reason="Poor image quality (too blurry)",
                clarity_score=clarity,
                distance_meters=distance
            )

        result = model_service.predict(data)

        label = result.get("label", "Unknown")
        confidence = float(result.get("confidence", 0.0))

        # Categorize waste and estimate weight
        waste_category, estimated_weight, base_stars, recyclability = categorize_waste(label, confidence)

        # Calculate rating
        rating = calculate_rating(waste_category, estimated_weight, clarity, confidence, base_stars)

        # Determine if this is valid e-waste
        is_valid_waste = rating > 0 and waste_category != "unknown"

        message = ""
        denial_reason = None

        if not is_valid_waste:
            rating = 0
            message = "Invalid image. No e-waste detected or confidence too low."
            denial_reason = "Not valid e-waste"
        else:
            # Success messages based on rating
            if rating >= 4:
                message = f"Excellent! High-value {waste_category} detected. Clear image, good recyclability."
            elif rating >= 3:
                message = f"Good submission! {waste_category.capitalize()} detected and accepted."
            elif rating >= 2:
                message = f"{waste_category.capitalize()} detected but image could be clearer or item is small."
            else:
                message = f"Low-value item detected. Try submitting larger or clearer e-waste."

        # Calculate credits: (rating × 10) + (weight × 5)
        credits_earned = int((rating * 10) + (estimated_weight * 5)) if is_valid_waste else 0

        # Update Firestore user stats
        stars_earned = rating
        new_total_stars = 0
        new_total_credits = 0
        
        try:
            user_ref = db.collection("users").document(user["uid"])
            user_doc = user_ref.get()

            if user_doc.exists:
                user_data = user_doc.to_dict()
                current_stars = user_data.get("totalStars", 0)
                current_credits = user_data.get("totalCredits", 0)
                current_tests = user_data.get("testsCompleted", 0)

                new_total_stars = current_stars + stars_earned
                new_total_credits = current_credits + credits_earned

                user_ref.update({
                    "totalStars": new_total_stars,
                    "totalCredits": new_total_credits,
                    "testsCompleted": current_tests + 1
                })
            else:
                new_total_stars = stars_earned
                new_total_credits = credits_earned
                user_ref.set({
                    "name": user.get("name", "User"),
                    "email": user.get("email", ""),
                    "totalStars": new_total_stars,
                    "totalCredits": new_total_credits,
                    "testsCompleted": 1
                })

        except Exception as e:
            print(f"Firestore update error: {e}")

        # Record report
        try:
            report_doc = {
                "userId": user.get("uid"),
                "binId": bin_id,
                "label": label,
                "confidence": confidence,
                "rating": rating,
                "clarity": clarity,
                "distance": distance,
                "waste_category": waste_category,
                "estimated_weight_kg": estimated_weight,
                "recyclability": recyclability,
                "credits_earned": credits_earned
            }
            db.collection("reports").add(report_doc)
        except Exception:
            pass

        # Build response
        response = {
            "label": label,
            "confidence": confidence,
            "all_predictions": result.get("all_predictions", {}),
            "stars_awarded": stars_earned,
            "new_total_stars": new_total_stars,
            "rating": rating,
            "message": message,
            "waste_type": waste_category,  # Keep for backward compatibility
            "waste_category": waste_category,
            "estimated_weight_kg": estimated_weight,
            "recyclability": recyclability,
            "clarity_score": clarity,
            "distance_meters": distance,
            "denial_reason": denial_reason,
            "credits_earned": credits_earned
        }

        return response
    except HTTPException:
        raise
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
