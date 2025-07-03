# app/api/endpoints/analytics.py
from fastapi import APIRouter
from app.services.analytics_service import get_usage_stats

router = APIRouter()

@router.get("/analytics/usage")
async def get_usage_analytics():
    """Endpoint to retrieve usage statistics."""
    stats = get_usage_stats()
    return stats
