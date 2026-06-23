// auth.js - Google OAuth Integration

function decodeJwtResponse(token) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

window.handleGoogleLogin = function(response) {
  try {
    const payload = decodeJwtResponse(response.credential);
    const user = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      role: 'USER' // default
    };

    const adminEmails = ['marzhendo03@gmail.com'];
    if (adminEmails.includes(user.email)) {
      user.role = 'ADMIN';
    }

    sessionStorage.setItem('focusGuardUser', JSON.stringify(user));
    window.location.reload();
  } catch (error) {
    console.error("Google login failed", error);
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.classList.remove('hidden');
  }
};

window.LoginManager = {
  getUser: function() {
    const userStr = sessionStorage.getItem('focusGuardUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch(e) {
        return null;
      }
    }
    return null;
  },

  isAdmin: function() {
    const user = this.getUser();
    return user ? user.role === 'ADMIN' : false;
  },

  getEmail: function() {
    const user = this.getUser();
    return user ? user.email : 'guest';
  },

  init: function() {
    const loginView = document.getElementById('login-view');
    const mainApp = document.getElementById('main-app');
    const user = this.getUser();
    
    if (user) {
      if (loginView) loginView.classList.add('hidden');
      if (mainApp) mainApp.classList.remove('hidden');
      this.setupUI(user);
      
      // Initialize AI *after* login
      if (typeof window.initAI === 'function') {
        window.initAI();
      }
    } else {
      if (loginView) loginView.classList.remove('hidden');
      if (mainApp) mainApp.classList.add('hidden');
    }
  },

  setupUI: function(user) {
    const isAdmin = this.isAdmin();

    const nameEl = document.getElementById('userProfileName');
    const roleEl = document.getElementById('userProfileRole');
    const avatarEl = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('btnLogout');
    const adminPanel = document.getElementById('adminControls');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) {
      roleEl.textContent = isAdmin ? 'ADMIN' : 'USER';
      if (isAdmin) {
        roleEl.classList.add('text-warning-yellow', 'font-bold');
      }
    }
    if (avatarEl) {
      avatarEl.src = user.picture;
      avatarEl.classList.remove('hidden');
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('focusGuardUser');
        if (window.google && google.accounts && google.accounts.id) {
            google.accounts.id.disableAutoSelect();
        }
        window.location.reload();
      });
    }

    if (adminPanel) {
      if (isAdmin) {
        adminPanel.classList.remove('hidden');
      } else {
        adminPanel.classList.add('hidden');
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.LoginManager.init();
});

window.RoleManager = {
  getEmail: function() {
    return window.LoginManager.getEmail();
  }
};
