from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict
from utils.auth import db
import uuid

router = APIRouter()


@router.post("/admin/seed")
def seed_admin_and_bins(admin_email: str = Body(...), admin_password: str = Body(...)):
    """Deletes common collections and seeds a single admin account and sample Delhi bins.
    This is intended for initial setup/demos.
    """
    try:
        # Delete common collections if they exist (users, reports, shops, images, complaints)
        collections_to_remove = ["users", "reports", "shops", "images", "complaints"]
        for col in collections_to_remove:
            try:
                docs = db.collection(col).stream()
                for d in docs:
                    db.collection(col).document(d.id).delete()
            except Exception:
                pass

        # Create or replace admin doc (plain password as requested)
        admin_ref = db.collection("admin").document("admin")
        admin_ref.set({
            "email": admin_email,
            "password": admin_password
        })

        # Seed bins (10 predefined locations in Delhi with capacity and status)
        bins = [
            {"binId": "BIN-CP", "latitude": 28.6328, "longitude": 77.2195, "areaName": "Connaught Place", "current_capacity": 0, "max_capacity": 100, "status": "active"},
            {"binId": "BIN-LN", "latitude": 28.5677, "longitude": 77.2756, "areaName": "Lajpat Nagar", "current_capacity": 0, "max_capacity": 100, "status": "active"},
            {"binId": "BIN-KB", "latitude": 28.6518, "longitude": 77.1900, "areaName": "Karol Bagh", "current_capacity": 45, "max_capacity": 100, "status": "active"},
            {"binId": "BIN-RH", "latitude": 28.7320, "longitude": 77.1170, "areaName": "Rohini", "current_capacity": 0, "max_capacity": 150, "status": "active"},
            {"binId": "BIN-DW", "latitude": 28.5921, "longitude": 77.0460, "areaName": "Dwarka", "current_capacity": 100, "max_capacity": 100, "status": "full"},
            {"binId": "BIN-SK", "latitude": 28.5244, "longitude": 77.2066, "areaName": "Saket", "current_capacity": 20, "max_capacity": 120, "status": "active"},
            {"binId": "BIN-JP", "latitude": 28.6215, "longitude": 77.0924, "areaName": "Janakpuri", "current_capacity": 0, "max_capacity": 100, "status": "active"},
            {"binId": "BIN-PP", "latitude": 28.6970, "longitude": 77.1315, "areaName": "Pitampura", "current_capacity": 0, "max_capacity": 100, "status": "inactive"},
            {"binId": "BIN-VK", "latitude": 28.5307, "longitude": 77.1580, "areaName": "Vasant Kunj", "current_capacity": 35, "max_capacity": 100, "status": "active"},
            {"binId": "BIN-NP", "latitude": 28.5494, "longitude": 77.2501, "areaName": "Nehru Place", "current_capacity": 0, "max_capacity": 150, "status": "active"}
        ]

        # Clear existing bins
        try:
            for d in db.collection("bins").stream():
                db.collection("bins").document(d.id).delete()
        except Exception:
            pass

        for b in bins:
            # Use provided binId as doc id
            db.collection("bins").document(b["binId"]).set(b)

        return {"status": "ok", "message": "Seeded admin and sample bins"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/login")
def admin_login(payload: Dict = Body(...)):
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing email or password")

    try:
        admin_doc = db.collection("admin").document("admin").get()
        if not admin_doc.exists:
            raise HTTPException(status_code=401, detail="Admin not configured")

        admin_data = admin_doc.to_dict()
        if admin_data.get("email") == email and admin_data.get("password") == password:
            return {"status": "ok", "message": "Admin authenticated"}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/bins")
def list_bins():
    bins = []
    try:
        for d in db.collection("bins").stream():
            data = d.to_dict()
            bins.append(data)
        return {"bins": bins}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/bins")
def create_bin(payload: Dict = Body(...)):
    try:
        bin_id = payload.get("binId") or f"BIN-{str(uuid.uuid4())[:8].upper()}"
        doc = {
            "binId": bin_id,
            "latitude": float(payload.get("latitude")),
            "longitude": float(payload.get("longitude")),
            "areaName": payload.get("areaName", ""),
            "current_capacity": float(payload.get("current_capacity", 0)),
            "max_capacity": float(payload.get("max_capacity", 100)),
            "status": payload.get("status", "active")
        }
        db.collection("bins").document(bin_id).set(doc)
        return {"status": "ok", "bin": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/admin/bins/{bin_id}")
def update_bin(bin_id: str, payload: Dict = Body(...)):
    try:
        ref = db.collection("bins").document(bin_id)
        if not ref.get().exists:
            raise HTTPException(status_code=404, detail="Bin not found")
        ref.update(payload)
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admin/bins/{bin_id}")
def delete_bin(bin_id: str):
    try:
        ref = db.collection("bins").document(bin_id)
        if not ref.get().exists:
            raise HTTPException(status_code=404, detail="Bin not found")
        ref.delete()
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/reset")
def reset_db():
    """Delete everything except admin and bins. Use with care."""
    try:
        protected = {"admin", "bins"}
        # Delete top-level collections except protected
        # Note: Firestore python client does not provide listing of all collections at root easily,
        # so target known collections used by app.
        target_collections = ["users", "reports", "shops", "images", "complaints"]
        for col in target_collections:
            try:
                for d in db.collection(col).stream():
                    db.collection(col).document(d.id).delete()
            except Exception:
                pass

        return {"status": "ok", "message": "Reset done (kept admin and bins)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
