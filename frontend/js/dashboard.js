/**
 * User Dashboard Controller
 */
const DashboardController = {
  async init() {
    this.setupTabs();
    await this.loadUserProfile();
    await this.loadTrips();
    await this.loadFavorites();
  },

  setupTabs() {
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const tab = e.currentTarget.dataset.tab;
        document.getElementById('tripsTabContent').style.display = tab === 'trips' ? 'block' : 'none';
        document.getElementById('favsTabContent').style.display = tab === 'favorites' ? 'block' : 'none';
      });
    });
  },

  async loadUserProfile() {
    const user = App.currentUser || {
      id: 1,
      name: 'Shipram Thakur',
      email: 'shipram@gmail.com',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop'
    };

    const nameEl = document.getElementById('dashUserName');
    const emailEl = document.getElementById('dashUserEmail');
    const avatarEl = document.getElementById('dashUserAvatar');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.src = user.avatar_url;
  },

  async loadTrips() {
    const grid = document.getElementById('savedTripsGrid');
    if (!grid) return;

    try {
      const trips = await API.getUserTrips(App.currentUser?.id || 1);
      
      const tripCountStat = document.getElementById('statTripsCount');
      if (tripCountStat) tripCountStat.textContent = trips.length;

      if (trips.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">🎒</div>
            <h3>No saved itineraries yet</h3>
            <p style="margin-top: 6px;">Start exploring destinations like Rishikesh and build your first smart trip!</p>
            <a href="/explore" class="btn btn-primary" style="margin-top: 18px;">Start Exploring</a>
          </div>
        `;
        return;
      }

      grid.innerHTML = trips.map(t => {
        const placesCount = t.itinerary_data?.days?.reduce((acc, d) => acc + d.stops.filter(s => !s.is_break).length, 0) || 0;
        return `
          <div class="trip-card">
            <div class="trip-card-header">
              <div class="trip-dest-badge">📍 ${t.destination_name}</div>
              <h3 class="trip-title">${t.title}</h3>
            </div>
            <div class="trip-card-body">
              <div class="trip-detail-row">
                <span>Duration</span>
                <strong>${t.duration_days} Day${t.duration_days > 1 ? 's' : ''}</strong>
              </div>
              <div class="trip-detail-row">
                <span>Places to Visit</span>
                <strong>${placesCount} Locations</strong>
              </div>
              <div class="trip-detail-row">
                <span>Transportation</span>
                <strong>${t.transport_mode}</strong>
              </div>
              <div class="trip-detail-row">
                <span>Estimated Budget</span>
                <strong style="color: var(--accent-hover);">₹${t.budget_estimated.toLocaleString()}</strong>
              </div>
            </div>
            <div class="trip-card-actions">
              <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="DashboardController.viewTripDetails(${t.id})">
                View Roadmap
              </button>
              <button class="btn btn-danger btn-sm" onclick="DashboardController.deleteTrip(${t.id})" title="Delete Trip">
                🗑
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      console.error(e);
    }
  },

  async loadFavorites() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;

    try {
      const favs = await API.getFavorites(App.currentUser?.id || 1);
      
      const favCountStat = document.getElementById('statFavsCount');
      if (favCountStat) favCountStat.textContent = favs.length;

      if (favs.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">♥</div>
            <h3>No bookmarked favorites yet</h3>
            <p style="margin-top: 6px;">Click the heart icon on any attraction card to save it here.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = favs.map(p => `
        <div class="place-card">
          <div class="place-card-image-wrap">
            <img src="${p.image_url}" alt="${p.name}" class="place-card-image" />
            <div class="place-card-badges">
              <span class="badge-category">${p.category}</span>
              ${p.is_hidden_gem ? '<span class="badge-hidden-gem">💎 Hidden Gem</span>' : ''}
            </div>
          </div>
          <div class="place-card-body">
            <div class="place-card-title-row">
              <h3 class="place-name">${p.name}</h3>
              <div class="place-rating-badge">⭐ ${p.rating}</div>
            </div>
            <p class="place-desc">${p.description}</p>
            <div class="place-card-actions" style="margin-top: 14px;">
              <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="DashboardController.addFavoriteToSelection(${p.id})">
                + Add to Trip
              </button>
              <button class="btn btn-danger btn-sm" onclick="DashboardController.removeFavorite(${p.id})">
                Remove
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error(e);
    }
  },

  async viewTripDetails(tripId) {
    try {
      const trip = await API.getUserTrips();
      const t = trip.find(item => item.id === tripId);
      if (!t) return;

      // Set destination in storage
      localStorage.setItem('active_destination', JSON.stringify({
        id: t.destination_id,
        name: t.destination_name
      }));

      // Extract places
      const stops = [];
      if (t.itinerary_data && t.itinerary_data.days) {
        t.itinerary_data.days.forEach(d => {
          d.stops.forEach(s => {
            if (s.place_id) {
              stops.push({ id: s.place_id, name: s.name, category: s.category });
            }
          });
        });
      }

      App.setSelectedPlaces(stops);
      window.location.href = '/planner';
    } catch (e) {
      App.toast('Could not open trip', 'warning');
    }
  },

  async deleteTrip(tripId) {
    if (!confirm('Are you sure you want to remove this saved itinerary?')) return;
    try {
      await API.deleteTrip(tripId);
      App.toast('Trip deleted', 'info');
      await this.loadTrips();
    } catch (e) {
      App.toast('Failed to delete trip', 'warning');
    }
  },

  async removeFavorite(placeId) {
    try {
      await API.toggleFavorite(placeId, App.currentUser?.id || 1);
      App.toast('Removed from favorites', 'info');
      await this.loadFavorites();
    } catch (e) {
      App.toast('Failed to remove favorite', 'warning');
    }
  },

  async addFavoriteToSelection(placeId) {
    try {
      const place = await API.getPlaceDetails(placeId);
      let selected = App.getSelectedPlaces();
      if (!selected.some(p => p.id === placeId)) {
        selected.push(place);
        App.setSelectedPlaces(selected);
        App.toast(`Added ${place.name} to trip selection!`, 'success');
      } else {
        App.toast(`${place.name} is already in your selection`, 'info');
      }
    } catch (e) {
      App.toast('Error adding place', 'warning');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('savedTripsGrid')) {
    DashboardController.init();
  }
});
