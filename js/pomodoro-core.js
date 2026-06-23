window.FocusGuard = window.FocusGuard || {};

window.FocusGuard.Core = {
  STATES: {
    IDLE: 'IDLE',
    FOCUS_ACTIVE: 'FOCUS_ACTIVE',
    WARNING: 'WARNING',
    BREAK_TIME: 'BREAK_TIME',
    ALERT: 'ALERT'
  },
  
  currentState: 'IDLE',
  timerInterval: null,
  timeRemaining: 25 * 60,
  sessionTotalDurationSet: 25 * 60,
  
  init: function() {
    window.sessionMetrics = {
      isActive: false, focusTime: 0, distractedTime: 0,
      faceLostTime: 0, warningCount: 0, alertCount: 0, sessionEvents: []
    };
    
    window.sessionReport = {
      score: 0, focusTime: 0, distractedTime: 0, faceLostTime: 0,
      warningCount: 0, alertCount: 0, badge: null, insight: null,
      monitoringQuality: null, sessionEvents: []
    };
    
    window.latestTelemetry = { isFaceLost: false };

    this.bindListeners();
    this.updateDisplay();
    
    window.getCurrentState = () => this.currentState;
    window.changeState = (state) => this.changeState(this.STATES[state] || state);
  },

  getCurrentSessionTime: function() {
    const elapsed = this.sessionTotalDurationSet - this.timeRemaining;
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  formatTime: function(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  updateDisplay: function() {
    const el = window.FocusGuard.UI.cachedElements;
    if (el.timerDisplay) {
      el.timerDisplay.textContent = this.formatTime(this.timeRemaining);
    }
  },

  enterWarningState: function() {
    const el = window.FocusGuard.UI.cachedElements;
    if (el.sessionTitle) el.sessionTitle.textContent = "Focus Session";
    if (el.sessionSubtitle) el.sessionSubtitle.textContent = "WARNING: DISTRACTION DETECTED";
    if (el.statusText) el.statusText.textContent = "WARNING";
    
    window.FocusGuard.UI.setThemeColor('warning-yellow');
    if (el.warningBanner) el.warningBanner.classList.remove('hidden');
    if (window.FocusGuard.Settings) window.FocusGuard.Settings.stopAlarm();
  },

  exitWarningState: function() {
    const el = window.FocusGuard.UI.cachedElements;
    if (el.warningBanner) el.warningBanner.classList.add('hidden');
  },

  enterAlertState: function() {
    const el = window.FocusGuard.UI.cachedElements;
    if (el.sessionTitle) el.sessionTitle.textContent = "Focus Session";
    if (el.sessionSubtitle) el.sessionSubtitle.textContent = "DISTRACTION DETECTED: PLEASE FOCUS!";
    if (el.statusText) el.statusText.textContent = "ALERT";
    
    window.FocusGuard.UI.setThemeColor('alert-red');
    if (el.warningBanner) el.warningBanner.classList.add('hidden');
    if (window.FocusEnvironment) window.FocusEnvironment.suspend();
    if (window.FocusGuard.Settings) window.FocusGuard.Settings.startAlarm();
  },

  exitAlertState: function() {
    if (window.FocusGuard.Settings) window.FocusGuard.Settings.stopAlarm();
    if (window.FocusEnvironment) window.FocusEnvironment.resume();
  },

  changeState: function(newState) {
    const prevState = this.currentState;
    this.currentState = newState;
    const el = window.FocusGuard.UI.cachedElements;
    
    if (prevState === this.STATES.WARNING && newState !== this.STATES.WARNING) {
      this.exitWarningState();
    }
    if (prevState === this.STATES.ALERT && newState !== this.STATES.ALERT) {
      this.exitAlertState();
    }
    
    if (newState === this.STATES.IDLE) {
      this.sessionTotalDurationSet = 25 * 60;
      this.timeRemaining = this.sessionTotalDurationSet;
      this.updateDisplay();
      if (window.FocusGuard.UI) window.FocusGuard.UI.resetTelemetry();
      
      if (el.sessionTitle) el.sessionTitle.textContent = "Focus Session";
      if (el.sessionSubtitle) el.sessionSubtitle.textContent = "System Ready";
      if (el.statusText) el.statusText.textContent = "AI STANDBY";
      
      window.FocusGuard.UI.setThemeColor('focus-green');
      if (this.timerInterval) clearInterval(this.timerInterval);
      
      if (el.envSelectionList && el.envLockedSummary) {
        el.envSelectionList.classList.remove('hidden');
        el.envLockedSummary.classList.add('hidden');
      }
    } 
    else if (newState === this.STATES.FOCUS_ACTIVE) {
      if (el.sessionTitle) el.sessionTitle.textContent = "Focus Session";
      if (el.sessionSubtitle) el.sessionSubtitle.textContent = "Deep Work Initiated";
      if (el.statusText) el.statusText.textContent = "AI ACTIVE";
      
      window.FocusGuard.UI.setThemeColor('focus-green');
      
      if (el.envSelectionList && el.envLockedSummary) {
        el.envSelectionList.classList.add('hidden');
        el.envLockedSummary.classList.remove('hidden');
        if (el.lockedEnvName && window.sessionMetrics && window.sessionMetrics.environmentType) {
          el.lockedEnvName.innerHTML = `🎧 ${window.sessionMetrics.environmentType}`;
        }
      }
    }
    else if (newState === this.STATES.WARNING) {
      if (prevState !== this.STATES.WARNING && window.sessionMetrics) {
        window.sessionMetrics.warningCount++;
        window.sessionMetrics.sessionEvents.push({ type: "WARNING", timestamp: this.getCurrentSessionTime() });
      }
      this.enterWarningState();
    }
    else if (newState === this.STATES.BREAK_TIME) {
      this.sessionTotalDurationSet = 5 * 60;
      this.timeRemaining = this.sessionTotalDurationSet;
      this.updateDisplay();
      if (window.FocusGuard.UI) window.FocusGuard.UI.resetTelemetry();
      
      if (el.sessionTitle) el.sessionTitle.textContent = "Break Time";
      if (el.sessionSubtitle) el.sessionSubtitle.textContent = "System Relaxed";
      if (el.statusText) el.statusText.textContent = "AI PAUSED";
      
      window.FocusGuard.UI.setThemeColor('break-blue');
    }
    else if (newState === this.STATES.ALERT) {
      if (prevState !== this.STATES.ALERT && window.sessionMetrics) {
        window.sessionMetrics.alertCount++;
        window.sessionMetrics.sessionEvents.push({ type: "ALERT", timestamp: this.getCurrentSessionTime() });
      }
      this.enterAlertState();
    }
  },

  tick: function() {
    if (window.sessionMetrics && window.sessionMetrics.isActive) {
      if (window.latestTelemetry && window.latestTelemetry.isFaceLost) {
        window.sessionMetrics.faceLostTime++;
      } else {
        if (this.currentState === this.STATES.FOCUS_ACTIVE) {
          window.sessionMetrics.focusTime++;
        } else if (this.currentState === this.STATES.WARNING || this.currentState === this.STATES.ALERT) {
          window.sessionMetrics.distractedTime++;
        }
      }
    }

    if (this.timeRemaining > 0) {
      this.timeRemaining--;
      this.updateDisplay();
    } else {
      if (this.currentState === this.STATES.FOCUS_ACTIVE || this.currentState === this.STATES.WARNING || this.currentState === this.STATES.ALERT) {
        if (window.FocusGuard.Reporter) window.FocusGuard.Reporter.generateSessionReport("SESSION COMPLETE", "completed");
        this.changeState(this.STATES.BREAK_TIME);
        this.startTimer();
      } else if (this.currentState === this.STATES.BREAK_TIME) {
        this.changeState(this.STATES.IDLE);
      }
    }
  },

  startTimer: function() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.tick(), 1000);
  },

  bindListeners: function() {
    const el = window.FocusGuard.UI.cachedElements;

    if (el.btnStart) {
      el.btnStart.addEventListener('click', () => {
        if (this.currentState === this.STATES.IDLE) {
          const goalValue = el.sessionGoalInput && el.sessionGoalInput.value.trim() !== '' ? el.sessionGoalInput.value.trim() : 'General Focus Session';
          
          const envRadios = document.querySelectorAll('input[name="focusEnv"]');
          let selectedEnv = "None";
          envRadios.forEach(radio => { if (radio.checked) selectedEnv = radio.value; });
          const envVol = el.envVolumeInput ? el.envVolumeInput.value : 50;

          window.sessionMetrics = {
            isActive: true, goal: goalValue, environmentType: selectedEnv,
            focusTime: 0, distractedTime: 0, faceLostTime: 0, warningCount: 0, alertCount: 0,
            sessionEvents: [{ type: "SESSION_START", timestamp: "00:00" }]
          };
          
          if (window.FocusEnvironment) window.FocusEnvironment.play(selectedEnv, envVol);
          
          this.changeState(this.STATES.FOCUS_ACTIVE);
        }
        this.startTimer();
      });
    }

    if (el.btnPause) {
      el.btnPause.addEventListener('click', () => {
        if (this.timerInterval) clearInterval(this.timerInterval);
      });
    }

    if (el.btnAbort) {
      el.btnAbort.addEventListener('click', () => {
        if (window.FocusEnvironment) window.FocusEnvironment.stop();
        if (window.FocusGuard.Reporter) window.FocusGuard.Reporter.generateSessionReport("SESSION ABORTED", "aborted");
        this.changeState(this.STATES.IDLE);
      });
    }

    if (el.btnAdminSkipBreak) {
      el.btnAdminSkipBreak.addEventListener('click', () => {
        if (this.currentState === this.STATES.FOCUS_ACTIVE || this.currentState === this.STATES.WARNING || this.currentState === this.STATES.ALERT) {
          window.sessionMetrics.isSimulation = true;
          if (window.FocusGuard.Reporter) window.FocusGuard.Reporter.generateSessionReport("SESSION COMPLETE", "completed");
          this.changeState(this.STATES.BREAK_TIME);
          this.startTimer();
        }
      });
    }

    if (el.btnAdminSkipComplete) {
      el.btnAdminSkipComplete.addEventListener('click', () => {
        if (this.currentState === this.STATES.FOCUS_ACTIVE || this.currentState === this.STATES.WARNING || this.currentState === this.STATES.ALERT) {
          window.sessionMetrics.focusTime = 25 * 60;
          window.sessionMetrics.isSimulation = true;
          if (window.FocusGuard.Reporter) window.FocusGuard.Reporter.generateSessionReport("SESSION COMPLETE", "completed");
        }
      });
    }

    if (el.btnAdminWarning) {
      el.btnAdminWarning.addEventListener('click', () => {
        if (this.currentState === this.STATES.FOCUS_ACTIVE) {
          this.changeState(this.STATES.WARNING);
        }
      });
    }

    if (el.btnAdminAlert) {
      el.btnAdminAlert.addEventListener('click', () => {
        if (this.currentState === this.STATES.FOCUS_ACTIVE || this.currentState === this.STATES.WARNING) {
          this.changeState(this.STATES.ALERT);
        }
      });
    }

    if (el.btnAdminReset) {
      el.btnAdminReset.addEventListener('click', () => {
        window.sessionMetrics.isActive = false;
        if (window.FocusEnvironment) window.FocusEnvironment.stop();
        this.changeState(this.STATES.IDLE);
      });
    }
  }
};
