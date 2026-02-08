from pydantic import BaseModel
from typing import Dict, Optional

class PredictionResponse(BaseModel):
    label: str
    confidence: float
    all_predictions: Dict[str, float]
    stars_awarded: int = 0
    new_total_stars: int = 0
    rating: int = 0
    message: str = ""
    waste_type: str = ""
    waste_category: str = ""
    estimated_weight_kg: float = 0.0
    recyclability: str = "unknown"
    clarity_score: float = 0.0
    distance_meters: float = 0.0
    denial_reason: Optional[str] = None
    credits_earned: int = 0

