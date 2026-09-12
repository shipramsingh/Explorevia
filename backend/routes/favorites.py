from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.models import Favorite, Place
from backend.schemas.schemas import PlaceOut, FavoriteToggle

router = APIRouter(prefix="/api", tags=["Favorites"])

@router.get("/favorites", response_model=List[PlaceOut])
def get_user_favorites(user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    """Retrieve bookmarked favorite attractions for a user."""
    favs = db.query(Favorite).filter(Favorite.user_id == user_id).all()
    place_ids = [f.place_id for f in favs]
    places = db.query(Place).filter(Place.id.in_(place_ids)).all()
    results = []
    for p in places:
        item = PlaceOut.model_validate(p)
        item.is_favorite = True
        results.append(item)
    return results

@router.post("/favorites/toggle")
def toggle_favorite(req: FavoriteToggle, db: Session = Depends(get_db)):
    """Toggle bookmark status on an attraction."""
    existing = db.query(Favorite).filter(
        Favorite.user_id == req.user_id,
        Favorite.place_id == req.place_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"favorited": False, "place_id": req.place_id, "message": "Removed from favorites"}
    else:
        new_fav = Favorite(user_id=req.user_id, place_id=req.place_id)
        db.add(new_fav)
        db.commit()
        return {"favorited": True, "place_id": req.place_id, "message": "Added to favorites"}
