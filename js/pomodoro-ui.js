window.FocusGuard = window.FocusGuard || {};

window.FocusGuard.UI = {
  cachedElements: {},

  cacheElements: function() {
    this.cachedElements = {
      timerDisplay: document.getElementById('timerDisplay'),
      btnStart: document.getElementById('btnStart'),
      btnPause: document.getElementById('btnPause'),
      btnAbort: document.getElementById('btnAbort'),
      sessionTitle: document.getElementById('sessionTitle'),
      sessionSubtitle: document.getElementById('sessionSubtitle'),
      statusCard: document.getElementById('statusCard'),
      statusDot: document.getElementById('statusDot'),
      statusText: document.getElementById('statusText'),
      pulseRing1: document.getElementById('pulseRing1'),
      pulseRing2: document.getElementById('pulseRing2'),
      warningBanner: document.getElementById('warningBanner'),
      warningText: document.getElementById('warningText'),
      telPanel: document.getElementById('telemetryPanel'),
      telStatus: document.getElementById('telStatus'),
      telFocusConf: document.getElementById('telFocusConf'),
      telDistractConf: document.getElementById('telDistractConf'),
      telCounter: document.getElementById('telCounter'),
      telProgressBar: document.getElementById('telProgressBar'),
      envSelectionList: document.getElementById('envSelectionList'),
      envLockedSummary: document.getElementById('envLockedSummary'),
      lockedEnvName: document.getElementById('lockedEnvName'),
      btnAdminSkipBreak: document.getElementById('btnAdminSkipBreak'),
      btnAdminSkipComplete: document.getElementById('btnAdminSkipComplete'),
      btnAdminWarning: document.getElementById('btnAdminWarning'),
      btnAdminAlert: document.getElementById('btnAdminAlert'),
      btnAdminReset: document.getElementById('btnAdminReset'),
      sessionGoalInput: document.getElementById('sessionGoalInput'),
      envVolumeInput: document.getElementById('focusEnvVolume'),
      navDashboard: document.getElementById('nav-dashboard'),
      navAnalytics: document.getElementById('nav-analytics'),
      navSettings: document.getElementById('nav-settings'),
      mainDashboard: document.getElementById('main-dashboard'),
      mainAnalytics: document.getElementById('main-analytics'),
      mainSettings: document.getElementById('main-settings')
    };

    // Binding Navigation
    this.bindNavigation();
  },

  setThemeColor: function(color) {
    const el = this.cachedElements;
    const themes = ['text-focus-green', 'text-break-blue', 'text-alert-red', 'text-warning-yellow'];
    const glows = ['text-glow', 'text-glow-blue', 'text-glow-red', 'text-glow-yellow'];
    const borders = [
      'border-focus-green/20', 'border-break-blue/20', 'border-alert-red/20', 'border-warning-yellow/20',
      'border-focus-green/30', 'border-break-blue/30', 'border-alert-red/30', 'border-warning-yellow/30'
    ];
    const bgs = ['bg-focus-green', 'bg-break-blue', 'bg-alert-red', 'bg-warning-yellow'];
    const shadows = [
      'shadow-[0_0_8px_#39FF14]', 'shadow-[0_0_8px_#3B82F6]', 
      'shadow-[0_0_8px_#EF4444]', 'shadow-[0_0_8px_#EAB308]'
    ];

    if (el.timerDisplay) el.timerDisplay.classList.remove(...themes, ...glows);
    if (el.statusCard) el.statusCard.classList.remove(...borders);
    if (el.statusDot) el.statusDot.classList.remove(...bgs, ...shadows);
    if (el.statusText) el.statusText.classList.remove(...themes);
    if (el.pulseRing1) el.pulseRing1.classList.remove(...borders);
    if (el.pulseRing2) el.pulseRing2.classList.remove(...borders);

    // Apply specific theme classes
    if (color === 'break-blue') {
      if (el.timerDisplay) el.timerDisplay.classList.add('text-break-blue', 'text-glow-blue');
      if (el.statusCard) el.statusCard.classList.add('border-break-blue/20');
      if (el.statusDot) el.statusDot.classList.add('bg-break-blue', 'shadow-[0_0_8px_#3B82F6]');
      if (el.statusText) el.statusText.classList.add('text-break-blue');
      if (el.pulseRing1) el.pulseRing1.classList.add('border-break-blue/30');
      if (el.pulseRing2) el.pulseRing2.classList.add('border-break-blue/20');
    } else if (color === 'alert-red') {
      if (el.timerDisplay) el.timerDisplay.classList.add('text-alert-red', 'text-glow-red');
      if (el.statusCard) el.statusCard.classList.add('border-alert-red/20');
      if (el.statusDot) el.statusDot.classList.add('bg-alert-red', 'shadow-[0_0_8px_#EF4444]');
      if (el.statusText) el.statusText.classList.add('text-alert-red');
      if (el.pulseRing1) el.pulseRing1.classList.add('border-alert-red/30');
      if (el.pulseRing2) el.pulseRing2.classList.add('border-alert-red/20');
    } else if (color === 'warning-yellow') {
      if (el.timerDisplay) el.timerDisplay.classList.add('text-warning-yellow', 'text-glow-yellow');
      if (el.statusCard) el.statusCard.classList.add('border-warning-yellow/20');
      if (el.statusDot) el.statusDot.classList.add('bg-warning-yellow', 'shadow-[0_0_8px_#EAB308]');
      if (el.statusText) el.statusText.classList.add('text-warning-yellow');
      if (el.pulseRing1) el.pulseRing1.classList.add('border-warning-yellow/30');
      if (el.pulseRing2) el.pulseRing2.classList.add('border-warning-yellow/20');
    } else {
      // Default focus-green
      if (el.timerDisplay) el.timerDisplay.classList.add('text-focus-green', 'text-glow');
      if (el.statusCard) el.statusCard.classList.add('border-focus-green/20');
      if (el.statusDot) el.statusDot.classList.add('bg-focus-green', 'shadow-[0_0_8px_#39FF14]');
      if (el.statusText) el.statusText.classList.add('text-focus-green');
      if (el.pulseRing1) el.pulseRing1.classList.add('border-focus-green/30');
      if (el.pulseRing2) el.pulseRing2.classList.add('border-focus-green/20');
    }
  },

  updateTelemetryUI: function(data) {
    const el = this.cachedElements;
    if (!el.telPanel || !el.telStatus || !el.telFocusConf || !el.telDistractConf || !el.telCounter || !el.telProgressBar) return;

    el.telPanel.classList.remove('opacity-50');
    el.telPanel.classList.add('opacity-100');

    el.telFocusConf.textContent = Math.round(data.focusProb * 100) + '%';
    el.telDistractConf.textContent = Math.round(data.distractProb * 100) + '%';
    
    const dTime = data.distractTime.toFixed(1);
    const alertThresh = window.FocusGuard.Settings.distractionConfig ? window.FocusGuard.Settings.distractionConfig.alertThreshold : 10;
    el.telCounter.textContent = `${dTime}s / ${alertThresh}s`;

    let progress = (data.distractTime / alertThresh) * 100;
    progress = Math.min(Math.max(progress, 0), 100);
    el.telProgressBar.style.width = `${progress}%`;

    el.telStatus.classList.remove('text-focus-green', 'text-warning-yellow', 'text-alert-red', 'text-white/70');
    el.telProgressBar.classList.remove('bg-focus-green', 'bg-warning-yellow', 'bg-alert-red', 'bg-white/50');

    window.latestTelemetry = window.latestTelemetry || {};
    window.latestTelemetry.isFaceLost = data.isFaceLost;

    const currentState = window.FocusGuard.Core ? window.FocusGuard.Core.currentState : 'IDLE';

    if (data.isFaceLost) {
      el.telStatus.textContent = "FACE NOT DETECTED";
      el.telStatus.classList.add('text-warning-yellow');
      el.telProgressBar.classList.add('bg-white/50');
      el.telProgressBar.style.width = '0%';
    } else {
      if (currentState === (window.FocusGuard.Core.STATES ? window.FocusGuard.Core.STATES.FOCUS_ACTIVE : 'FOCUS_ACTIVE')) {
        el.telStatus.textContent = "FOCUSING";
        el.telStatus.classList.add('text-focus-green');
        el.telProgressBar.classList.add('bg-focus-green');
      } else if (currentState === (window.FocusGuard.Core.STATES ? window.FocusGuard.Core.STATES.WARNING : 'WARNING')) {
        el.telStatus.textContent = "DISTRACTED";
        el.telStatus.classList.add('text-warning-yellow');
        el.telProgressBar.classList.add('bg-warning-yellow');
      } else if (currentState === (window.FocusGuard.Core.STATES ? window.FocusGuard.Core.STATES.ALERT : 'ALERT')) {
        el.telStatus.textContent = "ALERT";
        el.telStatus.classList.add('text-alert-red');
        el.telProgressBar.classList.add('bg-alert-red');
      } else {
        el.telStatus.textContent = "STANDBY";
        el.telStatus.classList.add('text-white/70');
        el.telProgressBar.classList.add('bg-white/50');
      }
    }
  },

  resetTelemetry: function() {
    const el = this.cachedElements;
    const currentState = window.FocusGuard.Core ? window.FocusGuard.Core.currentState : 'IDLE';
    const alertThresh = window.FocusGuard.Settings.distractionConfig ? window.FocusGuard.Settings.distractionConfig.alertThreshold : 10;
    
    if (!el.telPanel) return;
    el.telPanel.classList.remove('opacity-100');
    el.telPanel.classList.add('opacity-50');
    if (el.telFocusConf) el.telFocusConf.textContent = "0%";
    if (el.telDistractConf) el.telDistractConf.textContent = "0%";
    if (el.telCounter) el.telCounter.textContent = `0.0s / ${alertThresh}s`;
    if (el.telProgressBar) {
      el.telProgressBar.style.width = "0%";
      el.telProgressBar.classList.remove('bg-focus-green', 'bg-warning-yellow', 'bg-alert-red');
      el.telProgressBar.classList.add('bg-white/50');
    }
    if (el.telStatus) {
      el.telStatus.textContent = currentState === (window.FocusGuard.Core.STATES ? window.FocusGuard.Core.STATES.BREAK_TIME : 'BREAK_TIME') ? "MONITORING PAUSED" : "STANDBY";
      el.telStatus.classList.remove('text-focus-green', 'text-warning-yellow', 'text-alert-red');
      el.telStatus.classList.add('text-white/70');
    }
  },

  clearNav: function() {
    const el = this.cachedElements;
    [el.navDashboard, el.navAnalytics, el.navSettings].forEach(nav => {
      if(nav) {
        nav.classList.remove('bg-white/5', 'text-focus-green');
        nav.classList.add('text-white/50');
      }
    });
    [el.mainDashboard, el.mainAnalytics, el.mainSettings].forEach(main => {
      if(main) main.classList.add('hidden');
    });
  },

  bindNavigation: function() {
    const el = this.cachedElements;
    if (el.navDashboard) {
      el.navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearNav();
        el.navDashboard.classList.add('bg-white/5', 'text-focus-green');
        el.navDashboard.classList.remove('text-white/50');
        el.mainDashboard.classList.remove('hidden');
      });
    }

    if (el.navAnalytics) {
      el.navAnalytics.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearNav();
        el.navAnalytics.classList.add('bg-white/5', 'text-focus-green');
        el.navAnalytics.classList.remove('text-white/50');
        el.mainAnalytics.classList.remove('hidden');
        if (window.FocusGuard.Reporter && window.FocusGuard.Reporter.renderAnalytics) {
          window.FocusGuard.Reporter.renderAnalytics();
        }
      });
    }
    
    if (el.navSettings) {
      el.navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearNav();
        el.navSettings.classList.add('bg-white/5', 'text-focus-green');
        el.navSettings.classList.remove('text-white/50');
        el.mainSettings.classList.remove('hidden');
        if (window.FocusGuard.Settings && window.FocusGuard.Settings.renderSettings) {
          window.FocusGuard.Settings.renderSettings();
        }
      });
    }
  }
};

window.updateTelemetryUI = (data) => window.FocusGuard.UI.updateTelemetryUI(data);
