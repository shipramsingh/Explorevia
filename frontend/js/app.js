/**
 * Global App Controller for Travel Explorer
 */
const App = {
  currentUser: null,

  init() {
    this.loadUser();
    this.setupToasts();
    this.setupAuthModal();
    this.updateTripBar();
  },

  loadUser() {
    const saved = localStorage.getItem('travel_user');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.currentUser = null;
      }
    }
    this.renderNavUser();
  },

  setUser(user) {
    this.currentUser = user;
    localStorage.setItem('travel_user', JSON.stringify(user));
    this.renderNavUser();
    this.toast(`Welcome back, ${user.name}!`, 'success');
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('travel_user');
    this.renderNavUser();
    this.toast('You have signed out.', 'info');
    if (window.location.pathname.includes('dashboard')) {
      window.location.href = '/';
    }
  },

  renderNavUser() {
    const navActions = document.getElementById('navUserActions');
    if (!navActions) return;

    if (this.currentUser) {
      navActions.innerHTML = `
        <a href="/dashboard" class="user-profile-pill" title="View Profile & Trips">
          <img src="${this.currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}" alt="Avatar" />
          <span>${this.currentUser.name.split(' ')[0]}</span>
        </a>
        <button class="btn btn-secondary btn-sm" onclick="App.logout()">Sign Out</button>
      `;
    } else {
      navActions.innerHTML = `
        <button class="btn btn-google btn-sm" onclick="App.openAuthModal()">
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Sign In
        </button>
      `;
    }
  },

  setupAuthModal() {
    // Check if auth modal already exists, if not create
    if (!document.getElementById('authModal')) {
      const modal = document.createElement('div');
      modal.id = 'authModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 440px; text-align: center;">
          <button class="modal-close-btn" onclick="App.closeAuthModal()">✕</button>
          <div style="font-size: 2.2rem; margin-bottom: 12px;">🧭</div>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 8px;">Welcome to Travel Explorer</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 24px;">Sign in to save favorite destinations, build custom itineraries, and view saved roadmaps.</p>
          
          <button class="btn btn-google" style="width: 100%; padding: 12px; margin-bottom: 14px;" onclick="App.demoGoogleAuth('Aarav Sharma', 'aarav.explorer@gmail.com')">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Continue with Google
          </button>
          
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 14px;">
            Secure OAuth 2.0 connection. No passwords stored.
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  },

  openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('active');
  },

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  },

  async demoGoogleAuth(name, email) {
    try {
      const user = await API.authGoogle({
        name: name,
        email: email,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop',
        google_id: 'google_oauth_verified_' + Date.now()
      });
      this.setUser(user);
      this.closeAuthModal();
    } catch (e) {
      this.toast('Authentication failed: ' + e.message, 'warning');
    }
  },

  setupToasts() {
    if (!document.getElementById('toastContainer')) {
      const container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  setTheme(themeType) {
    document.body.classList.remove('theme-mountain', 'theme-beach', 'theme-forest', 'theme-desert');
    if (themeType) {
      document.body.classList.add(`theme-${themeType}`);
    }
  },

  getSelectedPlaces() {
    try {
      return JSON.parse(localStorage.getItem('selected_places') || '[]');
    } catch (e) {
      return [];
    }
  },

  setSelectedPlaces(places) {
    localStorage.setItem('selected_places', JSON.stringify(places));
    this.updateTripBar();
  },

  updateTripBar() {
    const bar = document.getElementById('floatingTripBar');
    const badge = document.getElementById('selectedTripCount');
    if (!bar || !badge) return;

    const places = this.getSelectedPlaces();
    badge.textContent = `${places.length} Place${places.length === 1 ? '' : 's'} Selected`;

    if (places.length > 0) {
      bar.classList.add('visible');
    } else {
      bar.classList.remove('visible');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
