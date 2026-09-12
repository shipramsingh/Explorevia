import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")


class Destination(Base):
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(100), default="India")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    theme_type = Column(String(50), default="mountain") # mountain, beach, forest, desert, spiritual
    tagline = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    hero_image = Column(String(500), nullable=True)

    places = relationship("Place", back_populates="destination", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="destination")


class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True) # Adventure, Water Activities, Nature, Spiritual, Scenic Views, Camping, Hiking, Food, Local Markets, Hidden Gems
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rating = Column(Float, default=4.5)
    review_count = Column(Integer, default=120)
    open_time = Column(String(10), default="08:00") # "08:00" in 24h
    close_time = Column(String(10), default="18:00") # "18:00" in 24h
    duration_hours = Column(Float, default=2.0)
    entry_fee = Column(Float, default=0.0) # In INR
    is_hidden_gem = Column(Boolean, default=False, index=True)
    popularity_score = Column(Float, default=85.0)
    image_url = Column(String(500), nullable=True)
    address = Column(String(255), nullable=True)
    best_time_to_visit = Column(String(100), default="Morning / Sunset")
    activity_type = Column(String(100), nullable=True)

    destination = relationship("Destination", back_populates="places")
    favorites = relationship("Favorite", back_populates="place", cascade="all, delete-orphan")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=False)
    destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False)
    duration_days = Column(Integer, default=1)
    starting_point = Column(String(255), default="Hotel")
    transport_mode = Column(String(50), default="Car")
    budget_allocated = Column(Float, default=3000.0)
    budget_estimated = Column(Float, default=2600.0)
    itinerary_data = Column(Text, nullable=False) # JSON encoded roadmap details
    status = Column(String(50), default="Saved") # Saved, Upcoming, Completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="trips")
    destination = relationship("Destination", back_populates="trips")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="favorites")
    place = relationship("Place", back_populates="favorites")
