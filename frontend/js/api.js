/**
 * Centralized API client for Travel Explorer
 */
const API_BASE = window.location.origin.includes(':8000') 
  ? '' 
  : 'http://127.0.0.1:8000';

const API = {
  async getDestinations() {
    const res = await fetch(`${API_BASE}/api/destinations`);
    if (!res.ok) throw new Error('Failed to fetch destinations');
    return res.json();
  },

  async getDestination(id) {
    const res = await fetch(`${API_BASE}/api/destinations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch destination details');
    return res.json();
  },

  async searchLocation(query) {
    const res = await fetch(`${API_BASE}/api/search-location?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search location');
    return res.json();
  },

  async getPlaces(params = {}) {
    const query = new URLSearchParams();
    if (params.destination_id) query.append('destination_id', params.destination_id);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.is_hidden_gem !== undefined && params.is_hidden_gem !== null) query.append('is_hidden_gem', params.is_hidden_gem);
    if (params.min_rating) query.append('min_rating', params.min_rating);
    if (params.max_cost) query.append('max_cost', params.max_cost);
    if (params.search) query.append('search', params.search);
    if (params.user_id) query.append('user_id', params.user_id);

    const res = await fetch(`${API_BASE}/api/places?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch places');
    return res.json();
  },

  async getPlaceDetails(placeId, userId = 1) {
    const res = await fetch(`${API_BASE}/api/places/${placeId}?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch place details');
    return res.json();
  },

  async getWeather(lat, lon, city) {
    const res = await fetch(`${API_BASE}/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Failed to fetch weather');
    return res.json();
  },

  async generateItinerary(payload) {
    const res = await fetch(`${API_BASE}/api/generate-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate itinerary');
    }
    return res.json();
  },

  async saveTrip(payload) {
    const res = await fetch(`${API_BASE}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save trip');
    return res.json();
  },

  async getUserTrips(userId = 1) {
    const res = await fetch(`${API_BASE}/api/trips?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user trips');
    return res.json();
  },

  async deleteTrip(tripId) {
    const res = await fetch(`${API_BASE}/api/trips/${tripId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete trip');
    return res.json();
  },

  async getFavorites(userId = 1) {
    const res = await fetch(`${API_BASE}/api/favorites?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch favorites');
    return res.json();
  },

  async toggleFavorite(placeId, userId = 1) {
    const res = await fetch(`${API_BASE}/api/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ place_id: placeId, user_id: userId })
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  },

  async authGoogle(payload) {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Authentication failed');
    return res.json();
  }
};
