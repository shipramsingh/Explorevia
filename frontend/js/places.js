/**
 * Destination & Places Discovery Controller
 */
let allCurrentPlaces = [];
let currentDestination = null;
let activeCategory = 'all';
let viewMode = 'grid'; // 'grid' or 'split'
let searchDebounceTimer = null;

const PlacesController = {
  async init() {
    this.setupEventListeners();
    await this.loadInitialDestination();
  },

  setupEventListeners() {
    // Search input debounce
    const searchInput = document.getElementById('destinationSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          this.handleDestinationSearch(e.target.value);
        }, 300);
      });
    }

    // Category chips
    document.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        activeCategory = target.dataset.category;
        this.filterAndRenderPlaces();
      });
    });

    // Rating & Price filter selectors
    const ratingFilter = document.getElementById('filterRating');
    const priceFilter = document.getElementById('filterPrice');
    const hiddenGemsToggle = document.getElementById('filterHiddenGemsOnly');

    if (ratingFilter) ratingFilter.addEventListener('change', () => this.filterAndRenderPlaces());
    if (priceFilter) priceFilter.addEventListener('change', () => this.filterAndRenderPlaces());
    if (hiddenGemsToggle) hiddenGemsToggle.addEventListener('change', () => this.filterAndRenderPlaces());
  },

  async loadInitialDestination() {
    try {
      // Check if destination ID is in URL query (?dest=1) or default to Rishikesh (ID: 1)
      const urlParams = new URLSearchParams(window.location.search);
      const destId = urlParams.get('dest') || 1;

      const destinations = await API.getDestinations();
      if (!destinations || destinations.length === 0) return;

      const dest = destinations.find(d => d.id == destId) || destinations[0];
      await this.selectDestination(dest);
    } catch (e) {
      console.error('Error loading initial destination:', e);
      App.toast('Could not connect to server. Please ensure the backend is running.', 'warning');
    }
  },

  async selectDestination(dest) {
    currentDestination = dest;
    localStorage.setItem('active_destination', JSON.stringify(dest));

    // Update dynamic background theme (mountain, beach, forest, desert)
    App.setTheme(dest.theme_type);

    // Update destination UI header
    document.getElementById('destinationTitle').textContent = `Explore ${dest.name}`;
    document.getElementById('destinationTagline').textContent = dest.tagline || dest.description || '';
    
    const heroBg = document.getElementById('exploreHeroBg');
    if (heroBg && dest.hero_image) {
      heroBg.style.backgroundImage = `url('${dest.hero_image}')`;
    }

    // Fetch live weather for this destination
    this.loadDestinationWeather(dest);

    // Initialize map centered at destination
    TravelMap.init('map', [dest.latitude, dest.longitude], 13);

    // Fetch places for this destination
    await this.fetchPlaces();
  },

  async loadDestinationWeather(dest) {
    const weatherPill = document.getElementById('destinationWeatherPill');
    if (!weatherPill) return;

    try {
      const weather = await API.getWeather(dest.latitude, dest.longitude, dest.name);
      weatherPill.innerHTML = `
        <div class="weather-icon-temp">
          <span>${weather.icon}</span>
          <span>${Math.round(weather.temperature)}°C</span>
        </div>
        <div class="weather-details">
          <div class="weather-condition">${weather.condition}</div>
          <div class="weather-sub">💧 ${weather.humidity}% • 🌧️ ${weather.precipitation_probability}% rain</div>
        </div>
      `;
      weatherPill.style.display = 'flex';
    } catch (e) {
      weatherPill.style.display = 'none';
    }
  },

  async fetchPlaces() {
    if (!currentDestination) return;

    try {
      const places = await API.getPlaces({ destination_id: currentDestination.id });
      allCurrentPlaces = places;
      this.filterAndRenderPlaces();
    } catch (e) {
      console.error('Failed to load places:', e);
    }
  },

  filterAndRenderPlaces() {
    if (!allCurrentPlaces) return;

    let filtered = [...allCurrentPlaces];

    // Category filter
    if (activeCategory && activeCategory !== 'all') {
      if (activeCategory === 'Hidden Gems') {
        filtered = filtered.filter(p => p.is_hidden_gem);
      } else {
        filtered = filtered.filter(p => p.category.toLowerCase().includes(activeCategory.toLowerCase()));
      }
    }

    // Hidden gems only toggle
    const gemsOnly = document.getElementById('filterHiddenGemsOnly')?.checked;
    if (gemsOnly) {
      filtered = filtered.filter(p => p.is_hidden_gem);
    }

    // Min rating
    const minRating = parseFloat(document.getElementById('filterRating')?.value || 0);
    if (minRating > 0) {
      filtered = filtered.filter(p => p.rating >= minRating);
    }

    // Max cost
    const maxCost = parseFloat(document.getElementById('filterPrice')?.value || 99999);
    if (maxCost < 99999) {
      filtered = filtered.filter(p => p.entry_fee <= maxCost);
    }

    // Update count
    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = `Showing ${filtered.length} Attraction${filtered.length === 1 ? '' : 's'}`;

    // Render cards
    this.renderPlacesCards(filtered);

    // Update map markers
    TravelMap.addPlaceMarkers(filtered);
  },

  renderPlacesCards(places) {
    const grid = document.getElementById('placesGrid');
    if (!grid) return;

    const selectedPlaceIds = new Set(App.getSelectedPlaces().map(p => p.id));

    if (places.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <h3>No attractions found matching these filters</h3>
          <p style="margin-top: 6px;">Try adjusting your category or price filters to explore more of ${currentDestination?.name || 'this city'}.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = places.map(p => {
      const isSelected = selectedPlaceIds.has(p.id);
      return `
        <div class="place-card ${isSelected ? 'selected' : ''}" id="placeCard-${p.id}">
          <div class="place-card-image-wrap">
            <img src="${p.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'}" alt="${p.name}" class="place-card-image" loading="lazy" />
            
            <div class="place-card-badges">
              <span class="badge-category">${p.category}</span>
              ${p.is_hidden_gem ? '<span class="badge-hidden-gem">💎 Hidden Gem</span>' : ''}
            </div>

            <button class="fav-button-overlay ${p.is_favorite ? 'favorited' : ''}" onclick="PlacesController.toggleFavorite(${p.id}, event)" title="Save to Favorites">
              ♥
            </button>
          </div>

          <div class="place-card-body">
            <div class="place-card-title-row">
              <h3 class="place-name">${p.name}</h3>
              <div class="place-rating-badge">⭐ ${p.rating}</div>
            </div>

            <p class="place-desc">${p.description}</p>

            <div class="place-meta-list">
              <div class="place-meta-item">
                <span>🕐</span>
                <span>${p.open_time} – ${p.close_time}</span>
              </div>
              <div class="place-meta-item">
                <span>⏱</span>
                <span><strong>${p.duration_hours}h</strong> visit</span>
              </div>
              <div class="place-meta-item">
                <span>💰</span>
                <span><strong>${p.entry_fee > 0 ? `₹${p.entry_fee}` : 'Free'}</strong></span>
              </div>
              <div class="place-meta-item">
                <span>👥</span>
                <span>${p.review_count.toLocaleString()} reviews</span>
              </div>
            </div>

            <div class="place-card-actions">
              <button class="btn btn-secondary btn-sm" onclick="PlacesController.openPlaceDetails(${p.id})">
                Details
              </button>
              <button class="btn btn-secondary btn-sm" onclick="TravelMap.flyTo(${p.latitude}, ${p.longitude}, 15)">
                Map
              </button>
              <button class="select-place-btn ${isSelected ? 'selected' : ''}" onclick="PlacesController.toggleSelectPlace(${p.id})">
                ${isSelected ? '✓ In Trip' : '+ Add to Trip'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  toggleSelectPlace(placeId) {
    const place = allCurrentPlaces.find(p => p.id === placeId);
    if (!place) return;

    let selected = App.getSelectedPlaces();
    const existingIndex = selected.findIndex(p => p.id === placeId);

    if (existingIndex > -1) {
      selected.splice(existingIndex, 1);
      App.toast(`Removed ${place.name} from trip selection`, 'info');
    } else {
      selected.push(place);
      App.toast(`Added ${place.name} to trip selection!`, 'success');
    }

    App.setSelectedPlaces(selected);

    // Update button visual
    const card = document.getElementById(`placeCard-${placeId}`);
    if (card) {
      const btn = card.querySelector('.select-place-btn');
      if (existingIndex > -1) {
        card.classList.remove('selected');
        if (btn) {
          btn.classList.remove('selected');
          btn.textContent = '+ Add to Trip';
        }
      } else {
        card.classList.add('selected');
        if (btn) {
          btn.classList.add('selected');
          btn.textContent = '✓ In Trip';
        }
      }
    }
  },

  async toggleFavorite(placeId, event) {
    if (event) event.stopPropagation();
    try {
      const res = await API.toggleFavorite(placeId, App.currentUser?.id || 1);
      App.toast(res.message, 'success');

      // Update icon in cards
      const place = allCurrentPlaces.find(p => p.id === placeId);
      if (place) place.is_favorite = res.favorited;

      const card = document.getElementById(`placeCard-${placeId}`);
      if (card) {
        const favBtn = card.querySelector('.fav-button-overlay');
        if (favBtn) {
          if (res.favorited) favBtn.classList.add('favorited');
          else favBtn.classList.remove('favorited');
        }
      }
    } catch (e) {
      App.toast('Failed to bookmark place: ' + e.message, 'warning');
    }
  },

  async openPlaceDetails(placeId) {
    try {
      const p = await API.getPlaceDetails(placeId, App.currentUser?.id || 1);
      const modal = document.getElementById('placeDetailModal');
      const content = document.getElementById('placeDetailModalContent');
      if (!modal || !content) return;

      content.innerHTML = `
        <img src="${p.image_url}" alt="${p.name}" class="modal-place-cover" />
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 18px; margin-bottom: 8px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem;">${p.name}</h2>
          <span class="place-rating-badge" style="font-size: 1rem;">⭐ ${p.rating} (${p.review_count} reviews)</span>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <span class="badge-category">${p.category}</span>
          ${p.is_hidden_gem ? '<span class="badge-hidden-gem">💎 Hidden Gem</span>' : ''}
        </div>

        <p style="color: #cbd5e1; font-size: 1rem; line-height: 1.6; margin-bottom: 20px;">
          ${p.description}
        </p>

        <div class="modal-meta-grid">
          <div><strong>Operating Hours:</strong><br>${p.open_time} to ${p.close_time}</div>
          <div><strong>Recommended Duration:</strong><br>${p.duration_hours} Hours</div>
          <div><strong>Estimated Entry:</strong><br>${p.entry_fee > 0 ? `₹${p.entry_fee}` : 'Free Entry'}</div>
          <div><strong>Best Time to Visit:</strong><br>${p.best_time_to_visit || 'Morning'}</div>
          <div style="grid-column: 1/-1;"><strong>Location / Address:</strong><br>${p.address || currentDestination.name}</div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn btn-primary" style="flex: 1;" onclick="PlacesController.toggleSelectPlace(${p.id}); PlacesController.closePlaceModal();">
            + Add to Trip Selection
          </button>
          <button class="btn btn-secondary" onclick="PlacesController.closePlaceModal(); TravelMap.flyTo(${p.latitude}, ${p.longitude}, 15);">
            View on Map
          </button>
        </div>
      `;

      modal.classList.add('active');
    } catch (e) {
      App.toast('Could not open place details', 'warning');
    }
  },

  closePlaceModal() {
    const modal = document.getElementById('placeDetailModal');
    if (modal) modal.classList.remove('active');
  },

  async handleDestinationSearch(query) {
    const dropdown = document.getElementById('searchSuggestionsDropdown');
    if (!dropdown) return;

    if (!query || query.trim().length === 0) {
      dropdown.classList.remove('active');
      return;
    }

    try {
      const res = await API.searchLocation(query);
      if (res.found && res.results.length > 0) {
        dropdown.innerHTML = res.results.map(d => `
          <div class="suggestion-item" onclick="PlacesController.selectDestinationFromSearch(${d.id})">
            <div>
              <strong>${d.name}</strong>, ${d.state}
              <div style="font-size: 0.78rem; color: var(--text-muted);">${d.tagline || ''}</div>
            </div>
            <span class="badge-category">${d.places_count} places</span>
          </div>
        `).join('');
        dropdown.classList.add('active');
      } else {
        dropdown.innerHTML = `
          <div style="padding: 14px; font-size: 0.88rem; color: var(--text-muted); text-align: center;">
            ${res.message || 'No matching destinations found'}
          </div>
        `;
        dropdown.classList.add('active');
      }
    } catch (e) {
      dropdown.classList.remove('active');
    }
  },

  async selectDestinationFromSearch(destId) {
    const dropdown = document.getElementById('searchSuggestionsDropdown');
    if (dropdown) dropdown.classList.remove('active');

    const destinations = await API.getDestinations();
    const dest = destinations.find(d => d.id == destId);
    if (dest) {
      await this.selectDestination(dest);
    }
  },

  toggleViewMode() {
    const layout = document.getElementById('exploreMainLayout');
    const toggleBtn = document.getElementById('viewModeToggleBtn');
    if (!layout || !toggleBtn) return;

    if (viewMode === 'grid') {
      viewMode = 'split';
      layout.classList.add('split-view');
      toggleBtn.innerHTML = '<span>⊞</span> <span>Full Grid View</span>';
    } else {
      viewMode = 'grid';
      layout.classList.remove('split-view');
      toggleBtn.innerHTML = '<span>🗺️</span> <span>Split Map View</span>';
    }

    setTimeout(() => {
      if (currentMap) currentMap.invalidateSize();
    }, 250);
  }
};

// Global helper for map marker callback
window.handlePlaceSelectionToggle = function(placeId) {
  PlacesController.toggleSelectPlace(placeId);
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('placesGrid')) {
    PlacesController.init();
  }
});
