import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.database import engine, Base
from backend.seed_data import seed_database
from backend.routes import locations, places, planner, weather, directions, trips, favorites, auth

# Initialize tables & seed data on startup
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Travel Explorer & Smart Trip Planner API",
    description="Intelligent travel discovery and automated itinerary optimization platform",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(locations.router)
app.include_router(places.router)
app.include_router(planner.router)
app.include_router(weather.router)
app.include_router(directions.router)
app.include_router(trips.router)
app.include_router(favorites.router)
app.include_router(auth.router)

# Mount frontend directory for full-stack unified serving
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "Travel Explorer Backend Running", "docs": "/docs"}

@app.get("/explore")
def serve_explore():
    explore_file = os.path.join(frontend_dir, "explore.html")
    if os.path.exists(explore_file):
        return FileResponse(explore_file)
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/planner")
def serve_planner():
    planner_file = os.path.join(frontend_dir, "planner.html")
    if os.path.exists(planner_file):
        return FileResponse(planner_file)
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/dashboard")
def serve_dashboard():
    dashboard_file = os.path.join(frontend_dir, "dashboard.html")
    if os.path.exists(dashboard_file):
        return FileResponse(dashboard_file)
    return FileResponse(os.path.join(frontend_dir, "index.html"))
