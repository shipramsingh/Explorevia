from fastapi import APIRouter, Query
from backend.services.routing_service import calculate_transit

router = APIRouter(prefix="/api", tags=["Directions"])

@router.get("/directions")
def get_directions(
    origin_lat: float = Query(...),
    origin_lng: float = Query(...),
    dest_lat: float = Query(...),
    dest_lng: float = Query(...),
    mode: str = Query("Car")
):
    """Calculate transit distance, duration, and segment cost between two points."""
    dist_km, duration_mins, cost = calculate_transit(
        origin_lat, origin_lng, dest_lat, dest_lng, mode
    )
    return {
        "distance_km": dist_km,
        "duration_minutes": duration_mins,
        "estimated_cost": cost,
        "mode": mode,
        "polyline": [
            {"lat": origin_lat, "lng": origin_lng},
            {"lat": (origin_lat + dest_lat) / 2 + 0.002, "lng": (origin_lng + dest_lng) / 2 + 0.002}, # realistic gentle curve
            {"lat": dest_lat, "lng": dest_lng}
        ]
    }
