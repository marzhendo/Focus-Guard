// auth.js - Role-Based Demo System

window.RoleManager = {
  getRole: function() {
    return sessionStorage.getItem('focusGuardRole') || null;
  },
  getUsername: function() {
    return sessionStorage.getItem('focusGuardUsername') || null;
  },
  isAdmin: function() {
    return this.getRole() === 'ADMIN';
  },
  login: function(username, password) {
    if (username === 'admin' && password === 'admin123') {
      sessionStorage.setItem('focusGuardUsername', 'admin');
      sessionStorage.setItem('focusGuardRole', 'ADMIN');
      return true;
    } else if (username === 'user' && password === 'user123') {
      sessionStorage.setItem('focusGuardUsername', 'user');
      sessionStorage.setItem('focusGuardRole', 'USER');
      return true;
    }
    return false;
  },
  logout: function() {
    sessionStorage.removeItem('focusGuardUsername');
    sessionStorage.removeItem('focusGuardRole');
    window.location.reload();
  }
};

window.LoginManager = {
  init: function() {
    const loginView = document.getElementById('login-view');
    const mainApp = document.getElementById('main-app');
    
    if (window.RoleManager.getRole()) {
      if (loginView) loginView.classList.add('hidden');
      if (mainApp) mainApp.classList.remove('hidden');
      this.setupUI();
    } else {
      if (loginView) loginView.classList.remove('hidden');
      if (mainApp) mainApp.classList.add('hidden');
      this.bindLogin();
    }
  },

  bindLogin: function() {
    const btnLogin = document.getElementById('btnLogin');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');

    if (btnLogin) {
      btnLogin.addEventListener('click', (e) => {
        e.preventDefault();
        const success = window.RoleManager.login(usernameInput.value.trim(), passwordInput.value.trim());
        if (success) {
          window.location.reload();
        } else {
          loginError.classList.remove('hidden');
        }
      });
    }
  },

  setupUI: function() {
    const username = window.RoleManager.getUsername();
    const isAdmin = window.RoleManager.isAdmin();

    const nameEl = document.getElementById('userProfileName');
    const roleEl = document.getElementById('userProfileRole');
    const logoutBtn = document.getElementById('btnLogout');
    const adminPanel = document.getElementById('adminControls');

    if (nameEl) nameEl.textContent = username === 'admin' ? 'Demo Admin' : 'Demo User';
    if (roleEl) {
      roleEl.textContent = isAdmin ? 'ADMIN | DEMO MODE ACTIVE' : 'USER';
      if (isAdmin) {
        roleEl.classList.add('text-warning-yellow', 'font-bold');
      }
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.RoleManager.logout();
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
