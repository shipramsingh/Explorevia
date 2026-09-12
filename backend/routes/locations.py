from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.models import Destination, Place
from backend.schemas.schemas import DestinationOut

router = APIRouter(prefix="/api", tags=["Locations"])

@router.get("/destinations", response_model=List[DestinationOut])
def get_destinations(db: Session = Depends(get_db)):
    """Retrieve all available travel destinations."""
    destinations = db.query(Destination).all()
    results = []
    for d in destinations:
        p_count = db.query(Place).filter(Place.destination_id == d.id).count()
        item = DestinationOut.model_validate(d)
        item.places_count = p_count
        results.append(item)
    return results

@router.get("/destinations/{destination_id}", response_model=DestinationOut)
def get_destination(destination_id: int, db: Session = Depends(get_db)):
    """Retrieve a single destination by ID."""
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    p_count = db.query(Place).filter(Place.destination_id == dest.id).count()
    item = DestinationOut.model_validate(dest)
    item.places_count = p_count
    return item

@router.get("/search-location")
def search_location(
    q: str = Query(..., min_length=1, description="Location search query (e.g. Rishikesh)"),
    db: Session = Depends(get_db)
):
    """Search destinations and places by name or state."""
    search_term = f"%{q.strip().lower()}%"
    destinations = db.query(Destination).filter(
        (Destination.name.ilike(search_term)) |
        (Destination.state.ilike(search_term))
    ).all()

    results = []
    for d in destinations:
        p_count = db.query(Place).filter(Place.destination_id == d.id).count()
        results.append({
            "id": d.id,
            "name": d.name,
            "state": d.state,
            "country": d.country,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "theme_type": d.theme_type,
            "tagline": d.tagline,
            "places_count": p_count,
            "hero_image": d.hero_image,
            "description": d.description
        })

    # If exact destination isn't in seed data, provide nearest available suggestion
    if not results:
        all_d = db.query(Destination).all()
        suggestions = [d.name for d in all_d]
        return {
            "query": q,
            "found": False,
            "message": f"We couldn't find '{q}'. Try searching for popular explorer hubs like: {', '.join(suggestions)}.",
            "results": [],
            "suggestions": suggestions
        }

    return {
        "query": q,
        "found": True,
        "results": results
    }
