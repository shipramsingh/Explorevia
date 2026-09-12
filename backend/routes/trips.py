import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.models import Trip, Destination
from backend.schemas.schemas import TripCreate, TripOut

router = APIRouter(prefix="/api", tags=["Trips"])

@router.post("/trips", response_model=TripOut)
def save_trip(trip_in: TripCreate, db: Session = Depends(get_db)):
    """Save a planned itinerary."""
    dest = db.query(Destination).filter(Destination.id == trip_in.destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")

    new_trip = Trip(
        user_id=trip_in.user_id or 1, # default demo user if unauthenticated
        title=trip_in.title,
        destination_id=trip_in.destination_id,
        duration_days=trip_in.duration_days,
        starting_point=trip_in.starting_point,
        transport_mode=trip_in.transport_mode,
        budget_allocated=trip_in.budget_allocated,
        budget_estimated=trip_in.budget_estimated,
        itinerary_data=json.dumps(trip_in.itinerary_data),
        status="Saved"
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    return TripOut(
        id=new_trip.id,
        title=new_trip.title,
        destination_id=new_trip.destination_id,
        destination_name=dest.name,
        duration_days=new_trip.duration_days,
        starting_point=new_trip.starting_point,
        transport_mode=new_trip.transport_mode,
        budget_allocated=new_trip.budget_allocated,
        budget_estimated=new_trip.budget_estimated,
        itinerary_data=json.loads(new_trip.itinerary_data),
        status=new_trip.status,
        created_at=new_trip.created_at
    )

@router.get("/trips", response_model=List[TripOut])
def get_user_trips(user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    """Retrieve saved and upcoming trips for a user."""
    trips = db.query(Trip).filter(Trip.user_id == user_id).order_by(Trip.created_at.desc()).all()
    results = []
    for t in trips:
        dest_name = t.destination.name if t.destination else "Destination"
        results.append(TripOut(
            id=t.id,
            title=t.title,
            destination_id=t.destination_id,
            destination_name=dest_name,
            duration_days=t.duration_days,
            starting_point=t.starting_point,
            transport_mode=t.transport_mode,
            budget_allocated=t.budget_allocated,
            budget_estimated=t.budget_estimated,
            itinerary_data=json.loads(t.itinerary_data),
            status=t.status,
            created_at=t.created_at
        ))
    return results

@router.get("/trips/{trip_id}", response_model=TripOut)
def get_single_trip(trip_id: int, db: Session = Depends(get_db)):
    """Retrieve details of a single saved itinerary."""
    t = db.query(Trip).filter(Trip.id == trip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")

    dest_name = t.destination.name if t.destination else "Destination"
    return TripOut(
        id=t.id,
        title=t.title,
        destination_id=t.destination_id,
        destination_name=dest_name,
        duration_days=t.duration_days,
        starting_point=t.starting_point,
        transport_mode=t.transport_mode,
        budget_allocated=t.budget_allocated,
        budget_estimated=t.budget_estimated,
        itinerary_data=json.loads(t.itinerary_data),
        status=t.status,
        created_at=t.created_at
    )

@router.delete("/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    """Delete a saved trip."""
    t = db.query(Trip).filter(Trip.id == trip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.delete(t)
    db.commit()
    return {"message": "Trip deleted successfully", "id": trip_id}
