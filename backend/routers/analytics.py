from fastapi import APIRouter
from typing import List, Dict

router = APIRouter()

@router.get("/analytics/global")
def get_global_analytics():
    return {
        "total_tests": 1240,
        "tests_passed": 1050,
        "tests_failed": 190,
        "total_stars": 5200
    }

@router.get("/analytics/user/{uid}")
def get_user_analytics(uid: str):
    # In real app, fetch from Firestore
    return {
        "uid": uid,
        "total_tests": 42,
        "tests_passed": 38,
        "stars_earned": 210,
        "history": [
            {"date": "2023-10-01", "result": "passed"},
            {"date": "2023-10-02", "result": "passed"}
        ]
    }
