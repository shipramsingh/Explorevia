from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.models import Place, Destination
from backend.schemas.schemas import ItineraryRequest, ItineraryResponse
from backend.services.itinerary_engine import generate_smart_itinerary

router = APIRouter(prefix="/api", tags=["Itinerary Planner"])

@router.post("/generate-itinerary", response_model=ItineraryResponse)
def generate_itinerary(req: ItineraryRequest, db: Session = Depends(get_db)):
    """
    Generate an optimized day-by-day roadmap:
    - Filters selected places
    - Solves shortest logical route
    - Injects food breaks & enforces opening hours
    - Calculates budget and provides status & savings advice
    """
    destination = db.query(Destination).filter(Destination.id == req.destination_id).first()
    if not destination:
        raise HTTPException(status_code=404, detail="Destination not found")

    places = db.query(Place).filter(Place.id.in_(req.place_ids)).all()
    if not places:
        raise HTTPException(status_code=400, detail="No valid places found for the selected IDs")

    result = generate_smart_itinerary(
        destination=destination,
        places=places,
        duration_days=req.duration_days,
        starting_point=req.starting_point,
        start_time_str=req.start_time,
        end_time_str=req.end_time,
        transport_mode=req.transport_mode,
        allocated_budget=req.budget or 3000.0,
        start_lat=req.start_lat,
        start_lng=req.start_lng
    )

    return result
