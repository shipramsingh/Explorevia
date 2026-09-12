from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.models import Place, Destination, Favorite
from backend.schemas.schemas import PlaceOut

router = APIRouter(prefix="/api", tags=["Places"])

@router.get("/places", response_model=List[PlaceOut])
def get_places(
    destination_id: Optional[int] = None,
    category: Optional[str] = None,
    is_hidden_gem: Optional[bool] = None,
    min_rating: Optional[float] = None,
    max_cost: Optional[float] = None,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Discover places with dynamic filtering:
    - destination_id
    - category (Adventure, Water Activities, Nature, Spiritual, Scenic Views, Camping, Hiking, Food, Hidden Gems)
    - is_hidden_gem
    - min_rating
    - max_cost
    - search
    """
    query = db.query(Place)

    if destination_id:
        query = query.filter(Place.destination_id == destination_id)

    if category and category.lower() != "all":
        if category.lower() == "hidden gems":
            query = query.filter(Place.is_hidden_gem == True)
        else:
            query = query.filter(Place.category.ilike(f"%{category}%"))

    if is_hidden_gem is not None:
        query = query.filter(Place.is_hidden_gem == is_hidden_gem)

    if min_rating is not None:
        query = query.filter(Place.rating >= min_rating)

    if max_cost is not None:
        query = query.filter(Place.entry_fee <= max_cost)

    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            (Place.name.ilike(search_term)) |
            (Place.description.ilike(search_term)) |
            (Place.category.ilike(search_term))
        )

    places = query.order_by(Place.popularity_score.desc()).all()

    # User favorite checking
    user_fav_place_ids = set()
    if user_id:
        favs = db.query(Favorite.place_id).filter(Favorite.user_id == user_id).all()
        user_fav_place_ids = {f[0] for f in favs}

    results = []
    for p in places:
        item = PlaceOut.model_validate(p)
        item.is_favorite = p.id in user_fav_place_ids
        results.append(item)

    return results


@router.get("/places/{place_id}", response_model=PlaceOut)
def get_place_details(place_id: int, user_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Retrieve detailed information about a single attraction."""
    place = db.query(Place).filter(Place.id == place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    is_fav = False
    if user_id:
        is_fav = db.query(Favorite).filter(
            Favorite.user_id == user_id,
            Favorite.place_id == place_id
        ).first() is not None

    item = PlaceOut.model_validate(place)
    item.is_favorite = is_fav
    return item
