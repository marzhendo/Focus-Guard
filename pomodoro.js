// pomodoro.js

document.addEventListener('DOMContentLoaded', () => {
  // --- Global States ---
  const STATES = {
    IDLE: 'IDLE',
    FOCUS_ACTIVE: 'FOCUS_ACTIVE',
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
  function playBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      
      // Beep sequence
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
      
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 150);
      
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  // --- State Management & UI Updates ---
  function changeState(newState) {
    currentState = newState;
    
    if (newState === STATES.IDLE) {
      timeRemaining = 25 * 60;
      updateDisplay();
      
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
    else if (newState === STATES.BREAK_TIME) {
      timeRemaining = 5 * 60;
      updateDisplay();
      
      if (sessionTitle) sessionTitle.textContent = "Break Time";
      if (sessionSubtitle) sessionSubtitle.textContent = "System Relaxed";
      if (statusText) statusText.textContent = "AI PAUSED";
      
      setThemeColor('break-blue');
    }
    else if (newState === STATES.ALERT) {
      if (sessionTitle) sessionTitle.textContent = "Focus Session";
      if (sessionSubtitle) sessionSubtitle.textContent = "DISTRACTION DETECTED: PLEASE FOCUS!";
      if (statusText) statusText.textContent = "ALERT";
      
      setThemeColor('alert-red');
      playBeep();
      // Notice: We DO NOT stop timerInterval here
    }
  }

  function setThemeColor(color) {
    // Clean up all possible theme classes first
    const themes = ['text-focus-green', 'text-break-blue', 'text-alert-red'];
    const glows = ['text-glow', 'text-glow-blue', 'text-glow-red'];
    const borders = ['border-focus-green/20', 'border-break-blue/20', 'border-alert-red/20', 'border-focus-green/30', 'border-break-blue/30', 'border-alert-red/30'];
    const bgs = ['bg-focus-green', 'bg-break-blue', 'bg-alert-red'];
    const shadows = ['shadow-[0_0_8px_#39FF14]', 'shadow-[0_0_8px_#3B82F6]', 'shadow-[0_0_8px_#EF4444]'];

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

  // --- Timer Logic ---
  function tick() {
    if (timeRemaining > 0) {
      timeRemaining--;
      updateDisplay();
    } else {
      // Timer reached 00:00
      if (currentState === STATES.FOCUS_ACTIVE || currentState === STATES.ALERT) {
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
});