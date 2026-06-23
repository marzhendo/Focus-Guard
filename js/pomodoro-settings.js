window.FocusGuard = window.FocusGuard || {};

window.FocusGuard.Settings = {
  defaultSettings: {
    warningDelay: 5,
    alertDelay: 10,
    warningVolume: 80,
    soundEnabled: true,
    selectedCamera: null,
    mirrorCamera: true
  },
  audioCtx: null,
  alarmInterval: null,
  previewStream: null,

  init: function() {
    this.loadSettings();
    
    this.distractionConfig = {
      get warningThreshold() { return window.focusGuardSettings.warningDelay; },
      get alertThreshold() { return window.focusGuardSettings.alertDelay; }
    };
    window.DISTRACTION_CONFIG = this.distractionConfig;
    window.updateMirrorState = () => this.updateMirrorState();

    this.bindSettingsListeners();
  },

  loadSettings: function() {
    try {
      const userEmail = window.RoleManager && window.RoleManager.getEmail ? window.RoleManager.getEmail() : 'guest';
      const data = localStorage.getItem('focusGuardSettings_' + userEmail);
      window.focusGuardSettings = data ? { ...this.defaultSettings, ...JSON.parse(data) } : { ...this.defaultSettings };
    } catch {
      window.focusGuardSettings = { ...this.defaultSettings };
    }
  },

  saveSettings: function() {
    try {
      const userEmail = window.RoleManager && window.RoleManager.getEmail ? window.RoleManager.getEmail() : 'guest';
      localStorage.setItem('focusGuardSettings_' + userEmail, JSON.stringify(window.focusGuardSettings));
    } catch (e) {
      console.warn("Gagal menyimpan Settings ke LocalStorage", e);
    }
  },

  startAlarm: function() {
    if (this.alarmInterval) return;
    if (!window.focusGuardSettings.soundEnabled) return;
    
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      let toggle = false;
      
      this.alarmInterval = setInterval(() => {
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(toggle ? 800 : 400, this.audioCtx.currentTime); 
        
        let volume = (window.focusGuardSettings.warningVolume / 100) * 0.1;
        gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.3);
        
        toggle = !toggle;
      }, 300);
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  },

  stopAlarm: function() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  },

  updateMirrorState: function() {
    const transformValue = window.focusGuardSettings.mirrorCamera ? "scaleX(-1)" : "scaleX(1)";
    const cameraPreview = document.getElementById('cameraPreview');
    if (cameraPreview) cameraPreview.style.transform = transformValue;
    
    const dashboardCanvases = document.querySelectorAll('#webcam-container canvas');
    dashboardCanvases.forEach(canvas => canvas.style.transform = transformValue);
  },

  updateSettingsUI: function() {
    const warningDelayInput = document.getElementById('warningDelayInput');
    const warningDelayValue = document.getElementById('warningDelayValue');
    const alertDelayInput = document.getElementById('alertDelayInput');
    const alertDelayValue = document.getElementById('alertDelayValue');
    const warningVolumeInput = document.getElementById('warningVolumeInput');
    const warningVolumeValue = document.getElementById('warningVolumeValue');
    const soundEnabledInput = document.getElementById('soundEnabledInput');
    const mirrorCameraInput = document.getElementById('mirrorCameraInput');
    const cameraSelect = document.getElementById('cameraSelect');

    if(!warningDelayInput) return;
    
    warningDelayInput.value = window.focusGuardSettings.warningDelay;
    warningDelayValue.textContent = window.focusGuardSettings.warningDelay + "s";
    
    alertDelayInput.value = window.focusGuardSettings.alertDelay;
    alertDelayValue.textContent = window.focusGuardSettings.alertDelay + "s";
    
    warningVolumeInput.value = window.focusGuardSettings.warningVolume;
    warningVolumeValue.textContent = window.focusGuardSettings.warningVolume + "%";
    
    soundEnabledInput.checked = window.focusGuardSettings.soundEnabled;
    if (mirrorCameraInput) mirrorCameraInput.checked = window.focusGuardSettings.mirrorCamera;
    
    if(window.focusGuardSettings.selectedCamera && cameraSelect.options.length > 0) {
      cameraSelect.value = window.focusGuardSettings.selectedCamera;
    }
    this.updateMirrorState();
  },

  renderSettings: function() {
    this.updateSettingsUI();
    this.loadCameras();
  },

  loadCameras: function() {
    const cameraSelect = document.getElementById('cameraSelect');
    if (!cameraSelect || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn("enumerateDevices not supported or elements missing.");
      return;
    }
    
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        cameraSelect.innerHTML = '';
        
        if (videoDevices.length === 0) {
          const opt = document.createElement('option');
          opt.value = "";
          opt.text = "No camera found";
          cameraSelect.appendChild(opt);
          return;
        }

        videoDevices.forEach(device => {
          const opt = document.createElement('option');
          opt.value = device.deviceId;
          opt.text = device.label || `Camera ${cameraSelect.length + 1}`;
          cameraSelect.appendChild(opt);
        });

        if (window.focusGuardSettings.selectedCamera && [...cameraSelect.options].some(o => o.value === window.focusGuardSettings.selectedCamera)) {
          cameraSelect.value = window.focusGuardSettings.selectedCamera;
        } else if (videoDevices.length > 0) {
          window.focusGuardSettings.selectedCamera = videoDevices[0].deviceId;
          cameraSelect.value = videoDevices[0].deviceId;
          this.saveSettings();
        }

        this.updateCameraPreview();
      })
      .catch(err => {
        console.error("Error enumerating devices:", err);
      });
  },

  updateCameraPreview: function() {
    const cameraSelect = document.getElementById('cameraSelect');
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraPreviewPlaceholder = document.getElementById('cameraPreviewPlaceholder');
    
    if(!cameraSelect) return;
    const deviceId = cameraSelect.value;
    if(!deviceId) return;
    
    if(this.previewStream) {
      this.previewStream.getTracks().forEach(t => t.stop());
    }

    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
      .then(stream => {
        this.previewStream = stream;
        if(cameraPreview) cameraPreview.srcObject = stream;
        if(cameraPreview) cameraPreview.classList.remove('hidden');
        if(cameraPreviewPlaceholder) cameraPreviewPlaceholder.classList.add('hidden');
      })
      .catch(err => {
        console.error("Preview error", err);
        if(cameraPreview) cameraPreview.classList.add('hidden');
        if(cameraPreviewPlaceholder) cameraPreviewPlaceholder.classList.remove('hidden');
      });
  },

  bindSettingsListeners: function() {
    const warningDelayInput = document.getElementById('warningDelayInput');
    const warningDelayValue = document.getElementById('warningDelayValue');
    const alertDelayInput = document.getElementById('alertDelayInput');
    const alertDelayValue = document.getElementById('alertDelayValue');
    const warningVolumeInput = document.getElementById('warningVolumeInput');
    const warningVolumeValue = document.getElementById('warningVolumeValue');
    const soundEnabledInput = document.getElementById('soundEnabledInput');
    const mirrorCameraInput = document.getElementById('mirrorCameraInput');
    const cameraSelect = document.getElementById('cameraSelect');
    const btnRestoreDefaults = document.getElementById('btnRestoreDefaults');
    const btnClearHistory = document.getElementById('btnClearHistory');
    const envVolumeInput = document.getElementById('focusEnvVolume');

    if(warningDelayInput) {
      warningDelayInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if(val >= parseInt(alertDelayInput.value)) {
           val = parseInt(alertDelayInput.value) - 1;
           e.target.value = val;
        }
        warningDelayValue.textContent = val + "s";
        window.focusGuardSettings.warningDelay = val;
        this.saveSettings();
      });
    }

    if(alertDelayInput) {
      alertDelayInput.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if(val <= parseInt(warningDelayInput.value)) {
           val = parseInt(warningDelayInput.value) + 1;
           e.target.value = val;
        }
        alertDelayValue.textContent = val + "s";
        window.focusGuardSettings.alertDelay = val;
        this.saveSettings();
      });
    }

    if(warningVolumeInput) {
      warningVolumeInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        warningVolumeValue.textContent = val + "%";
        window.focusGuardSettings.warningVolume = val;
        this.saveSettings();
      });
    }

    if(soundEnabledInput) {
      soundEnabledInput.addEventListener('change', (e) => {
        window.focusGuardSettings.soundEnabled = e.target.checked;
        this.saveSettings();
      });
    }

    if(mirrorCameraInput) {
      mirrorCameraInput.addEventListener('change', (e) => {
        window.focusGuardSettings.mirrorCamera = e.target.checked;
        this.saveSettings();
        this.updateMirrorState();
      });
    }

    if(cameraSelect) {
      cameraSelect.addEventListener('change', (e) => {
        window.focusGuardSettings.selectedCamera = e.target.value;
        this.saveSettings();
        this.updateCameraPreview();
      });
    }

    if(btnRestoreDefaults) {
      btnRestoreDefaults.addEventListener('click', () => {
        window.focusGuardSettings = { ...this.defaultSettings };
        this.saveSettings();
        this.updateSettingsUI();
        this.updateCameraPreview();
      });
    }

    if (btnClearHistory) {
      btnClearHistory.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear all session history and achievements? This action cannot be undone.")) {
          const userEmail = window.RoleManager && window.RoleManager.getEmail ? window.RoleManager.getEmail() : 'guest';
          localStorage.removeItem('focusGuardHistory_' + userEmail);
          localStorage.removeItem('focusGuardAchievements_' + userEmail);
          if (window.FocusGuard.Reporter && window.FocusGuard.Reporter.renderAnalytics) window.FocusGuard.Reporter.renderAnalytics();
        }
      });
    }

    if (envVolumeInput) {
      envVolumeInput.addEventListener('input', (e) => {
        if (window.FocusEnvironment && window.FocusEnvironment.isPlaying) {
          window.FocusEnvironment.setVolume(e.target.value);
        }
      });
    }
  }
};
