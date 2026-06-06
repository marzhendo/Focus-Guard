// pomodoro.js

document.addEventListener('DOMContentLoaded', () => {
  // --- Configuration ---
  window.DISTRACTION_CONFIG = {
    warningThreshold: 5,
    alertThreshold: 10
  };

  // --- Global States ---
  const STATES = {
    IDLE: 'IDLE',
    FOCUS_ACTIVE: 'FOCUS_ACTIVE',
    WARNING: 'WARNING',
    BREAK_TIME: 'BREAK_TIME',
    ALERT: 'ALERT'
  };

  // Global variables
  let currentState = STATES.IDLE;
  let timerInterval = null;
  let timeRemaining = 25 * 60; // default 25 minutes in seconds

  // --- DOM Elements ---
  const timerDisplay = document.getElementById('timerDisplay');
  const btnStart = document.getElementById('btnStart');
  const btnPause = document.getElementById('btnPause');
  const btnAbort = document.getElementById('btnAbort');

  const sessionTitle = document.getElementById('sessionTitle');
  const sessionSubtitle = document.getElementById('sessionSubtitle');
  const statusCard = document.getElementById('statusCard');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const pulseRing1 = document.getElementById('pulseRing1');
  const pulseRing2 = document.getElementById('pulseRing2');
  
  const warningBanner = document.getElementById('warningBanner');
  const warningText = document.getElementById('warningText');

  const telPanel = document.getElementById('telemetryPanel');
  const telStatus = document.getElementById('telStatus');
  const telFocusConf = document.getElementById('telFocusConf');
  const telDistractConf = document.getElementById('telDistractConf');
  const telCounter = document.getElementById('telCounter');
  const telProgressBar = document.getElementById('telProgressBar');

  // --- Helper Functions ---
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateDisplay() {
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(timeRemaining);
    }
  }

  // Web Audio API for alerting
  let audioCtx = null;
  let alarmInterval = null;

  function startAlarm() {
    if (alarmInterval) return; // already playing
    
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      let toggle = false;
      
      alarmInterval = setInterval(() => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(toggle ? 800 : 400, audioCtx.currentTime); 
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
        
        toggle = !toggle;
      }, 300); // Alternate every 300ms
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  function stopAlarm() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  // --- Specific State Functions ---
  function enterWarningState() {
    if (sessionTitle) sessionTitle.textContent = "Focus Session";
    if (sessionSubtitle) sessionSubtitle.textContent = "WARNING: DISTRACTION DETECTED";
    if (statusText) statusText.textContent = "WARNING";
    
    setThemeColor('warning-yellow');
    if (warningBanner) warningBanner.classList.remove('hidden');
    stopAlarm(); // Ensure no audio
  }

  function exitWarningState() {
    if (warningBanner) warningBanner.classList.add('hidden');
  }

  function enterAlertState() {
    if (sessionTitle) sessionTitle.textContent = "Focus Session";
    if (sessionSubtitle) sessionSubtitle.textContent = "DISTRACTION DETECTED: PLEASE FOCUS!";
    if (statusText) statusText.textContent = "ALERT";
    
    setThemeColor('alert-red');
    if (warningBanner) warningBanner.classList.add('hidden'); // Hide warning banner
    startAlarm();
  }

  function exitAlertState() {
    stopAlarm();
  }

  // --- State Management & UI Updates ---
  function changeState(newState) {
    const prevState = currentState;
    currentState = newState;
    
    // Call exit functions if leaving specific states
    if (prevState === STATES.WARNING && newState !== STATES.WARNING) {
      exitWarningState();
    }
    if (prevState === STATES.ALERT && newState !== STATES.ALERT) {
      exitAlertState();
    }
    
    if (newState === STATES.IDLE) {
      timeRemaining = 25 * 60;
      updateDisplay();
      resetTelemetry();
      
      if (sessionTitle) sessionTitle.textContent = "Focus Session";
      if (sessionSubtitle) sessionSubtitle.textContent = "System Ready";
      if (statusText) statusText.textContent = "AI STANDBY";
      
      setThemeColor('focus-green');
      if (timerInterval) clearInterval(timerInterval);
    } 
    else if (newState === STATES.FOCUS_ACTIVE) {
      if (sessionTitle) sessionTitle.textContent = "Focus Session";
      if (sessionSubtitle) sessionSubtitle.textContent = "System Armed & Monitoring";
      if (statusText) statusText.textContent = "AI ACTIVE";
      
      setThemeColor('focus-green');
    }
    else if (newState === STATES.WARNING) {
      enterWarningState();
    }
    else if (newState === STATES.BREAK_TIME) {
      timeRemaining = 5 * 60;
      updateDisplay();
      resetTelemetry();
      
      if (sessionTitle) sessionTitle.textContent = "Break Time";
      if (sessionSubtitle) sessionSubtitle.textContent = "System Relaxed";
      if (statusText) statusText.textContent = "AI PAUSED";
      
      setThemeColor('break-blue');
    }
    else if (newState === STATES.ALERT) {
      enterAlertState();
    }
  }

  function setThemeColor(color) {
    // Clean up all possible theme classes first
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

    if (timerDisplay) timerDisplay.classList.remove(...themes, ...glows);
    if (statusCard) statusCard.classList.remove(...borders);
    if (statusDot) statusDot.classList.remove(...bgs, ...shadows);
    if (statusText) statusText.classList.remove(...themes);
    if (pulseRing1) pulseRing1.classList.remove(...borders);
    if (pulseRing2) pulseRing2.classList.remove(...borders);

    // Apply specific theme classes
    if (color === 'break-blue') {
      if (timerDisplay) timerDisplay.classList.add('text-break-blue', 'text-glow-blue');
      if (statusCard) statusCard.classList.add('border-break-blue/20');
      if (statusDot) statusDot.classList.add('bg-break-blue', 'shadow-[0_0_8px_#3B82F6]');
      if (statusText) statusText.classList.add('text-break-blue');
      if (pulseRing1) pulseRing1.classList.add('border-break-blue/30');
      if (pulseRing2) pulseRing2.classList.add('border-break-blue/20');
    } else if (color === 'alert-red') {
      if (timerDisplay) timerDisplay.classList.add('text-alert-red', 'text-glow-red');
      if (statusCard) statusCard.classList.add('border-alert-red/20');
      if (statusDot) statusDot.classList.add('bg-alert-red', 'shadow-[0_0_8px_#EF4444]');
      if (statusText) statusText.classList.add('text-alert-red');
      if (pulseRing1) pulseRing1.classList.add('border-alert-red/30');
      if (pulseRing2) pulseRing2.classList.add('border-alert-red/20');
    } else if (color === 'warning-yellow') {
      if (timerDisplay) timerDisplay.classList.add('text-warning-yellow', 'text-glow-yellow');
      if (statusCard) statusCard.classList.add('border-warning-yellow/20');
      if (statusDot) statusDot.classList.add('bg-warning-yellow', 'shadow-[0_0_8px_#EAB308]');
      if (statusText) statusText.classList.add('text-warning-yellow');
      if (pulseRing1) pulseRing1.classList.add('border-warning-yellow/30');
      if (pulseRing2) pulseRing2.classList.add('border-warning-yellow/20');
    } else {
      // Default focus-green
      if (timerDisplay) timerDisplay.classList.add('text-focus-green', 'text-glow');
      if (statusCard) statusCard.classList.add('border-focus-green/20');
      if (statusDot) statusDot.classList.add('bg-focus-green', 'shadow-[0_0_8px_#39FF14]');
      if (statusText) statusText.classList.add('text-focus-green');
      if (pulseRing1) pulseRing1.classList.add('border-focus-green/30');
      if (pulseRing2) pulseRing2.classList.add('border-focus-green/20');
    }
  }

  // --- Telemetry Updates ---
  function updateTelemetryUI(data) {
    if (!telPanel || !telStatus || !telFocusConf || !telDistractConf || !telCounter || !telProgressBar) return;

    // Set panel fully visible when active
    telPanel.classList.remove('opacity-50');
    telPanel.classList.add('opacity-100');

    // Update confidences
    telFocusConf.textContent = Math.round(data.focusProb * 100) + '%';
    telDistractConf.textContent = Math.round(data.distractProb * 100) + '%';
    
    // Update counter
    const dTime = data.distractTime.toFixed(1);
    telCounter.textContent = `${dTime}s / ${window.DISTRACTION_CONFIG.alertThreshold}s`;

    // Calculate progress
    let progress = (data.distractTime / window.DISTRACTION_CONFIG.alertThreshold) * 100;
    progress = Math.min(Math.max(progress, 0), 100);
    telProgressBar.style.width = `${progress}%`;

    // Clear previous colors
    telStatus.classList.remove('text-focus-green', 'text-warning-yellow', 'text-alert-red', 'text-white/70');
    telProgressBar.classList.remove('bg-focus-green', 'bg-warning-yellow', 'bg-alert-red', 'bg-white/50');

    if (data.isFaceLost) {
      telStatus.textContent = "FACE NOT DETECTED";
      telStatus.classList.add('text-warning-yellow');
      telProgressBar.classList.add('bg-white/50');
      telProgressBar.style.width = '0%';
    } else {
      if (currentState === STATES.FOCUS_ACTIVE) {
        telStatus.textContent = "FOCUSING";
        telStatus.classList.add('text-focus-green');
        telProgressBar.classList.add('bg-focus-green');
      } else if (currentState === STATES.WARNING) {
        telStatus.textContent = "DISTRACTED";
        telStatus.classList.add('text-warning-yellow');
        telProgressBar.classList.add('bg-warning-yellow');
      } else if (currentState === STATES.ALERT) {
        telStatus.textContent = "ALERT";
        telStatus.classList.add('text-alert-red');
        telProgressBar.classList.add('bg-alert-red');
      } else {
        telStatus.textContent = "STANDBY";
        telStatus.classList.add('text-white/70');
        telProgressBar.classList.add('bg-white/50');
      }
    }
  }

  function resetTelemetry() {
    if (!telPanel) return;
    telPanel.classList.remove('opacity-100');
    telPanel.classList.add('opacity-50');
    if (telFocusConf) telFocusConf.textContent = "0%";
    if (telDistractConf) telDistractConf.textContent = "0%";
    if (telCounter) telCounter.textContent = `0.0s / ${window.DISTRACTION_CONFIG.alertThreshold}s`;
    if (telProgressBar) {
      telProgressBar.style.width = "0%";
      telProgressBar.classList.remove('bg-focus-green', 'bg-warning-yellow', 'bg-alert-red');
      telProgressBar.classList.add('bg-white/50');
    }
    if (telStatus) {
      telStatus.textContent = currentState === STATES.BREAK_TIME ? "MONITORING PAUSED" : "STANDBY";
      telStatus.classList.remove('text-focus-green', 'text-warning-yellow', 'text-alert-red');
      telStatus.classList.add('text-white/70');
    }
  }

  // --- Timer Logic ---
  function tick() {
    if (timeRemaining > 0) {
      timeRemaining--;
      updateDisplay();
    } else {
      // Timer reached 00:00
      if (currentState === STATES.FOCUS_ACTIVE || currentState === STATES.WARNING || currentState === STATES.ALERT) {
        changeState(STATES.BREAK_TIME);
        startTimer(); // Auto-start the 5 min break timer
      } else if (currentState === STATES.BREAK_TIME) {
        changeState(STATES.IDLE); // Reset back to idle
      }
    }
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval); // Avoid duplicate intervals
    timerInterval = setInterval(tick, 1000);
  }

  // --- Event Listeners ---
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      console.log('Tombol Start di-klik');
      if (currentState === STATES.IDLE) {
        changeState(STATES.FOCUS_ACTIVE);
      }
      startTimer();
    });
  }

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      console.log('Tombol Pause di-klik');
      if (timerInterval) clearInterval(timerInterval);
    });
  }

  if (btnAbort) {
    btnAbort.addEventListener('click', () => {
      console.log('Tombol Abort di-klik');
      changeState(STATES.IDLE);
    });
  }

  // Sidebar link prevention for demo purposes
  const navLinks = document.querySelectorAll('aside nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Navigation feature disabled in this phase.');
    });
  });

  // Initialize timer display on page load
  updateDisplay();

  // --- EXPORT GLOBALS FOR AI.JS ---
  window.getCurrentState = () => currentState;
  window.changeState = (newState) => {
    if (STATES[newState]) {
      changeState(STATES[newState]);
    }
  };
  window.updateTelemetryUI = updateTelemetryUI;
});