# 🧭 Travel Explorer — Smart Trip Planner & Travel Discovery

A modern, visually captivating, responsive full-stack web application designed to help travelers discover popular and lesser-known hidden attractions in iconic destinations, select preferred places, and automatically generate optimized roadmaps with time scheduling, route maps, live weather forecasts, and budget breakdowns.

---

## 🌟 Key Features

1. **High-Impact Landing Page**:
   - Full-screen adventure hero visuals with dark-to-transparent overlays.
   - Tagline: *"Discover places. Build memories. Explore smarter."*
   - Direct CTAs for instant exploration and Google Sign-In.

2. **Destination & Attraction Discovery Dashboard**:
   - Live location search with instant autocomplete (e.g., **Rishikesh**, **Goa**, **Manali**, **Jaipur**, **Meghalaya**).
   - Category filtering: 🏔️ Adventure, 🌊 Water Activities, 🌲 Nature, 🛕 Spiritual, 📸 Scenic Views, 🥾 Hiking, 🍴 Food, and 💎 **Hidden Gems**.
   - Verified ratings, review counts, opening & closing hours, estimated visit durations, and realistic entry fees.
   - Dynamic destination background theming (Mountains, Coastlines/Beaches, Forests, Deserts).

3. **Interactive Map & Split View**:
   - Interactive Leaflet cartography with custom category pins, glowing hidden gem badges, and marker info cards.
   - Seamless toggle between Full Grid View and Split Map View.

4. **Smart Roadmap & Itinerary Optimization Engine**:
   - Nearest-neighbor routing algorithm to minimize travel time and prevent criss-crossing.
   - Enforces attraction operating hours (warns if a stop closes before arrival).
   - Automatic lunch break injection around 12:30 PM – 1:30 PM.
   - Multi-day clustering for long trips or high attraction counts.
   - Numbered waypoint route visualization on the interactive map.

5. **Budget Estimation & Smart Suggestions**:
   - Itemized budget table: Transportation, Entry Tickets, Food, Activities, and Miscellaneous buffer.
   - Dynamic budget status flag: 🟢 **Within Budget**, 🟡 **Slightly Above Budget**, 🔴 **Over Budget**.
   - Actionable cost-reduction suggestions.
   - Live weather integration via Open-Meteo with smart weather travel advisories.

6. **User Dashboard & Bookmarks**:
   - Google Sign-In flow with demo profile simulation.
   - Save planned roadmaps to your account.
   - Bookmark favorite attractions and add them directly to trip selections.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **HTML5 & Vanilla JavaScript**: Modular architecture (`app.js`, `api.js`, `map.js`, `places.js`, `planner.js`, `dashboard.js`).
- **Vanilla CSS3**: Design system with glassmorphism, responsive flex/grid layouts, smooth animations, and custom destination themes.
- **Leaflet.js**: Vector mapping with custom SVG markers and route polylines.

### Backend
- **Python FastAPI**: Asynchronous REST API architecture with auto-generated OpenAPI docs at `/docs`.
- **SQLAlchemy ORM**: SQLite for zero-config local development, seamlessly switchable to PostgreSQL via `DATABASE_URL`.
- **Pydantic v2**: Strict request and response data validation.
- **Open-Meteo API**: Real-time live temperature, humidity, and weather codes without mandatory API keys.

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Python 3.10+ installed
- Pip package manager

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Initialize & Seed Database
```bash
python -m backend.seed_data
```

### 4. Run the Full-Stack Server
```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Open your browser and navigate to:
```
http://127.0.0.1:8000
```

API Documentation (Swagger UI) is accessible at:
```
http://127.0.0.1:8000/docs
```

---

## 🗺️ REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/destinations` | List all curated travel hubs |
| `GET` | `/api/search-location?q=Rishikesh` | Search destinations & places |
| `GET` | `/api/places` | Filter places by destination, category, hidden gem, rating, price |
| `GET` | `/api/places/{id}` | Single attraction detailed overview |
| `POST`| `/api/generate-itinerary` | Smart roadmap scheduling & budget estimation |
| `GET` | `/api/weather` | Live weather & forecast by lat/lon |
| `GET` | `/api/directions` | Distance and travel duration between coordinates |
| `POST`| `/api/trips` | Save an itinerary |
| `GET` | `/api/trips` | Get user saved trips |
| `POST`| `/api/favorites/toggle` | Toggle place bookmark |
| `POST`| `/api/auth/google` | Google sign-in / profile sync |

---

## 📄 License
MIT License. Built with ❤️ for travelers everywhere.
