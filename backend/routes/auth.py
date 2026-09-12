import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.models import User
from backend.schemas.schemas import UserAuth, UserOut

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/google", response_model=UserOut)
def google_auth(auth_data: UserAuth, db: Session = Depends(get_db)):
    """
    Authenticate user via Google Sign-In or Demo login.
    If credential (JWT) or user profile info is supplied, resolves or creates the user record.
    """
    email = auth_data.email or "traveler@example.com"
    name = auth_data.name or "Adventure Traveler"
    avatar = auth_data.avatar_url or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop"
    google_id = auth_data.google_id or "demo_google_id_101"

    # Find or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=avatar
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url
    )

@router.get("/me", response_model=UserOut)
def get_current_user(user_id: int = 1, db: Session = Depends(get_db)):
    """Retrieve currently active profile."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Create default demo user
        user = User(
            id=1,
            email="traveler@example.com",
            name="Aarav Sharma",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return UserOut.model_validate(user)
