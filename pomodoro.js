// pomodoro.js

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
  timerDisplay.textContent = formatTime(timeRemaining);
}

// --- State Management & UI Updates ---
function changeState(newState) {
  currentState = newState;
  
  if (newState === STATES.IDLE) {
    timeRemaining = 25 * 60;
    updateDisplay();
    
    sessionTitle.textContent = "Focus Session";
    sessionSubtitle.textContent = "System Ready";
    statusText.textContent = "AI STANDBY";
    
    setThemeColor('focus-green');
    clearInterval(timerInterval);
  } 
  else if (newState === STATES.FOCUS_ACTIVE) {
    sessionTitle.textContent = "Focus Session";
    sessionSubtitle.textContent = "System Armed & Monitoring";
    statusText.textContent = "AI ACTIVE";
    
    setThemeColor('focus-green');
  } 
  else if (newState === STATES.BREAK_TIME) {
    timeRemaining = 5 * 60;
    updateDisplay();
    
    sessionTitle.textContent = "Break Time";
    sessionSubtitle.textContent = "System Relaxed";
    statusText.textContent = "AI PAUSED";
    
    setThemeColor('break-blue');
  }
}

function setThemeColor(color) {
  if (color === 'break-blue') {
    timerDisplay.classList.replace('text-focus-green', 'text-break-blue');
    timerDisplay.classList.replace('text-glow', 'text-glow-blue');
    
    statusCard.classList.replace('border-focus-green/20', 'border-break-blue/20');
    
    statusDot.classList.replace('bg-focus-green', 'bg-break-blue');
    statusDot.classList.replace('shadow-[0_0_8px_#39FF14]', 'shadow-[0_0_8px_#3B82F6]');
    
    statusText.classList.replace('text-focus-green', 'text-break-blue');
    
    pulseRing1.classList.replace('border-focus-green/30', 'border-break-blue/30');
    pulseRing2.classList.replace('border-focus-green/20', 'border-break-blue/20');
  } else {
    timerDisplay.classList.replace('text-break-blue', 'text-focus-green');
    timerDisplay.classList.replace('text-glow-blue', 'text-glow');
    
    statusCard.classList.replace('border-break-blue/20', 'border-focus-green/20');
    
    statusDot.classList.replace('bg-break-blue', 'bg-focus-green');
    statusDot.classList.replace('shadow-[0_0_8px_#3B82F6]', 'shadow-[0_0_8px_#39FF14]');
    
    statusText.classList.replace('text-break-blue', 'text-focus-green');
    
    pulseRing1.classList.replace('border-break-blue/30', 'border-focus-green/30');
    pulseRing2.classList.replace('border-break-blue/20', 'border-focus-green/20');
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
  clearInterval(timerInterval); // Avoid duplicate intervals
  timerInterval = setInterval(tick, 1000);
}

// --- Event Listeners ---
btnStart.addEventListener('click', () => {
  if (currentState === STATES.IDLE) {
    changeState(STATES.FOCUS_ACTIVE);
  }
  startTimer();
});

btnPause.addEventListener('click', () => {
  clearInterval(timerInterval);
});

btnAbort.addEventListener('click', () => {
  changeState(STATES.IDLE);
});

// Initialize timer display on page load
updateDisplay();
