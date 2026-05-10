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
      clearInterval(timerInterval);
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
  }

  function setThemeColor(color) {
    if (color === 'break-blue') {
      if (timerDisplay) {
        timerDisplay.classList.replace('text-focus-green', 'text-break-blue');
        timerDisplay.classList.replace('text-glow', 'text-glow-blue');
      }
      if (statusCard) statusCard.classList.replace('border-focus-green/20', 'border-break-blue/20');
      if (statusDot) {
        statusDot.classList.replace('bg-focus-green', 'bg-break-blue');
        statusDot.classList.replace('shadow-[0_0_8px_#39FF14]', 'shadow-[0_0_8px_#3B82F6]');
      }
      if (statusText) statusText.classList.replace('text-focus-green', 'text-break-blue');
      if (pulseRing1) pulseRing1.classList.replace('border-focus-green/30', 'border-break-blue/30');
      if (pulseRing2) pulseRing2.classList.replace('border-focus-green/20', 'border-break-blue/20');
    } else {
      // Revert back to focus-green
      if (timerDisplay) {
        timerDisplay.classList.replace('text-break-blue', 'text-focus-green');
        timerDisplay.classList.replace('text-glow-blue', 'text-glow');
      }
      if (statusCard) statusCard.classList.replace('border-break-blue/20', 'border-focus-green/20');
      if (statusDot) {
        statusDot.classList.replace('bg-break-blue', 'bg-focus-green');
        statusDot.classList.replace('shadow-[0_0_8px_#3B82F6]', 'shadow-[0_0_8px_#39FF14]');
      }
      if (statusText) statusText.classList.replace('text-break-blue', 'text-focus-green');
      if (pulseRing1) pulseRing1.classList.replace('border-break-blue/30', 'border-focus-green/30');
      if (pulseRing2) pulseRing2.classList.replace('border-break-blue/20', 'border-focus-green/20');
    }
  }

  // --- Timer Logic ---
  function tick() {
    if (timeRemaining > 0) {
      timeRemaining--;
      updateDisplay();
    } else {
      // Timer reached 00:00
      if (currentState === STATES.FOCUS_ACTIVE) {
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
});