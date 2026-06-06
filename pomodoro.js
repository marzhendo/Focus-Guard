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

  // --- Session Metrics Engine ---
  window.sessionMetrics = {
    isActive: false,
    focusTime: 0,
    distractedTime: 0,
    faceLostTime: 0,
    warningCount: 0,
    alertCount: 0,
    sessionEvents: []
  };
  
  window.sessionReport = {
    score: 0,
    focusTime: 0,
    distractedTime: 0,
    faceLostTime: 0,
    warningCount: 0,
    alertCount: 0,
    badge: null,
    insight: null,
    monitoringQuality: null,
    sessionEvents: []
  };

  let latestTelemetry = { isFaceLost: false };

  // Track session duration elapsed
  let sessionTotalDurationSet = 25 * 60;

  function getCurrentSessionTime() {
    const elapsed = sessionTotalDurationSet - timeRemaining;
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

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
      sessionTotalDurationSet = 25 * 60;
      timeRemaining = sessionTotalDurationSet;
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
      if (prevState !== STATES.WARNING) {
        window.sessionMetrics.warningCount++;
        window.sessionMetrics.sessionEvents.push({ type: "WARNING", timestamp: getCurrentSessionTime() });
      }
      enterWarningState();
    }
    else if (newState === STATES.BREAK_TIME) {
      sessionTotalDurationSet = 5 * 60;
      timeRemaining = sessionTotalDurationSet;
      updateDisplay();
      resetTelemetry();
      
      if (sessionTitle) sessionTitle.textContent = "Break Time";
      if (sessionSubtitle) sessionSubtitle.textContent = "System Relaxed";
      if (statusText) statusText.textContent = "AI PAUSED";
      
      setThemeColor('break-blue');
    }
    else if (newState === STATES.ALERT) {
      if (prevState !== STATES.ALERT) {
        window.sessionMetrics.alertCount++;
        window.sessionMetrics.sessionEvents.push({ type: "ALERT", timestamp: getCurrentSessionTime() });
      }
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

    latestTelemetry.isFaceLost = data.isFaceLost;

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
    // Metrics tracking
    if (window.sessionMetrics.isActive) {
      if (latestTelemetry.isFaceLost) {
        window.sessionMetrics.faceLostTime++;
      } else {
        if (currentState === STATES.FOCUS_ACTIVE) {
          window.sessionMetrics.focusTime++;
        } else if (currentState === STATES.WARNING || currentState === STATES.ALERT) {
          window.sessionMetrics.distractedTime++;
        }
      }
    }

    if (timeRemaining > 0) {
      timeRemaining--;
      updateDisplay();
    } else {
      // Timer reached 00:00
      if (currentState === STATES.FOCUS_ACTIVE || currentState === STATES.WARNING || currentState === STATES.ALERT) {
        generateSessionReport("SESSION COMPLETE");
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

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      console.log('Tombol Start di-klik');
      if (currentState === STATES.IDLE) {
        window.sessionMetrics = {
          isActive: true,
          focusTime: 0,
          distractedTime: 0,
          faceLostTime: 0,
          warningCount: 0,
          alertCount: 0,
          sessionEvents: [{ type: "SESSION_START", timestamp: "00:00" }]
        };
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
      generateSessionReport("SESSION ABORTED");
      changeState(STATES.IDLE);
    });
  }

  // --- ANALYTICS DASHBOARD MANAGER ---
  const navDashboard = document.getElementById('nav-dashboard');
  const navAnalytics = document.getElementById('nav-analytics');
  const mainDashboard = document.getElementById('main-dashboard');
  const mainAnalytics = document.getElementById('main-analytics');

  if (navDashboard && navAnalytics) {
    navDashboard.addEventListener('click', (e) => {
      e.preventDefault();
      navDashboard.classList.add('bg-white/5', 'text-focus-green');
      navDashboard.classList.remove('text-white/50');
      navAnalytics.classList.remove('bg-white/5', 'text-focus-green');
      navAnalytics.classList.add('text-white/50');
      
      mainDashboard.classList.remove('hidden');
      mainAnalytics.classList.add('hidden');
    });

    navAnalytics.addEventListener('click', (e) => {
      e.preventDefault();
      navAnalytics.classList.add('bg-white/5', 'text-focus-green');
      navAnalytics.classList.remove('text-white/50');
      navDashboard.classList.remove('bg-white/5', 'text-focus-green');
      navDashboard.classList.add('text-white/50');
      
      mainDashboard.classList.add('hidden');
      mainAnalytics.classList.remove('hidden');
      
      renderAnalytics();
    });
  }

  function renderAnalytics() {
    const history = loadSessionHistory();
    const emptyState = document.getElementById('analytics-empty-state');
    const content = document.getElementById('analytics-content');
    
    if (!history || history.length === 0) {
      if(emptyState) emptyState.classList.remove('hidden');
      if(content) content.classList.add('hidden');
      return;
    }
    
    if(emptyState) emptyState.classList.add('hidden');
    if(content) content.classList.remove('hidden');

    let totalScore = 0;
    let totalMonitoring = 0;
    let bestScore = 0;
    
    history.forEach(session => {
      totalScore += session.score || 0;
      totalMonitoring += session.monitoringConfidence || 0;
      if ((session.score || 0) > bestScore) {
        bestScore = session.score || 0;
      }
    });

    const avgScore = Math.round(totalScore / history.length);
    const avgMonitoring = Math.round(totalMonitoring / history.length);

    document.getElementById('kpi-avg-score').textContent = avgScore;
    document.getElementById('kpi-avg-monitoring').textContent = avgMonitoring + "%";
    document.getElementById('kpi-total-sessions').textContent = history.length;
    document.getElementById('kpi-best-score').textContent = bestScore;

    // Render Table
    const tbody = document.getElementById('analytics-table-body');
    if(tbody) {
      tbody.innerHTML = '';
      
      // Sort descending by timestamp
      const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

      sortedHistory.forEach(session => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 transition-colors";
        
        const dateStr = new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        
        const scoreColor = session.score >= 90 ? "text-focus-green" : session.score >= 75 ? "text-focus-green" : session.score >= 60 ? "text-warning-yellow" : "text-alert-red";
        const monColor = session.monitoringConfidence >= 95 ? "text-focus-green" : session.monitoringConfidence >= 80 ? "text-[#EAB308]" : session.monitoringConfidence >= 60 ? "text-warning-yellow" : "text-alert-red";

        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-white/80">${dateStr}</td>
          <td class="px-6 py-4 whitespace-nowrap"><span class="font-bold ${scoreColor}">${session.score}</span></td>
          <td class="px-6 py-4 whitespace-nowrap"><span class="${monColor}">${session.monitoringConfidence}%</span></td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-white/60">${session.warnings}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-white/60">${session.alerts}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // Initialize timer display on page load
  updateDisplay();

  // --- SESSION REPORT MANAGER ---
  function generateInsight(alertCount, warningCount, faceLostTime, totalSessionDuration) {
    if (faceLostTime > 0.2 * totalSessionDuration) {
      return "Monitoring reliability was reduced because the face was frequently not visible.";
    }
    if (alertCount > 0) {
      return "Multiple prolonged distractions occurred during the session.";
    }
    if (warningCount > 3) {
      return "Frequent attention shifts were detected.";
    }
    if (alertCount === 0 && warningCount <= 2) {
      return "Excellent sustained concentration throughout the session.";
    }
    return "Good session with typical amounts of brief distraction.";
  }

  // --- SESSION HISTORY MANAGER ---
  function loadSessionHistory() {
    try {
      const data = localStorage.getItem("focusGuardHistory");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveSessionHistory(historyArray) {
    try {
      localStorage.setItem("focusGuardHistory", JSON.stringify(historyArray));
    } catch (e) {
      console.warn("Gagal menyimpan ke LocalStorage", e);
    }
  }

  function generateSessionReport(title) {
    if (!window.sessionMetrics.isActive) return;
    window.sessionMetrics.isActive = false; // Stop tracking

    window.sessionMetrics.sessionEvents.push({ type: "SESSION_COMPLETE", timestamp: getCurrentSessionTime() });

    const m = window.sessionMetrics;
    const totalActiveTime = m.focusTime + m.distractedTime;
    const totalSessionDuration = totalActiveTime + m.faceLostTime;

    const modal = document.getElementById('sessionReportModal');
    if (!modal) return;

    if (totalSessionDuration < 60) {
      document.getElementById('reportContentContainer').classList.add('hidden');
      document.getElementById('reportEdgeWarning').classList.remove('hidden');
      
      const h3 = modal.querySelector('#reportTitle');
      const p = modal.querySelector('#reportRating');
      if(h3) h3.textContent = title;
      if(p) {
        p.textContent = "Score Not Available";
        p.className = "font-mono text-sm font-bold text-white/50";
      }
      modal.classList.remove('hidden');
      return;
    }

    document.getElementById('reportContentContainer').classList.remove('hidden');
    document.getElementById('reportEdgeWarning').classList.add('hidden');

    const observedTime = m.focusTime + m.distractedTime;
    let focusRatio = 0;
    
    if (observedTime > 0) {
        focusRatio = m.focusTime / observedTime;
    }
    
    let baseScore = focusRatio * 100;
    const warningPenalty = m.warningCount * 2;
    const alertPenalty = m.alertCount * 5;
    
    let finalScore = Math.round(baseScore - warningPenalty - alertPenalty);
    finalScore = Math.max(0, Math.min(finalScore, 100)); // Clamp ke 0-100

    let categoryTitle = "";
    let badgeText = "";
    let colorClass = "";
    
    if (finalScore >= 90) {
      categoryTitle = "Excellent Focus";
      badgeText = "🏆 Deep Work Master";
      colorClass = "text-focus-green";
    } else if (finalScore >= 75) {
      categoryTitle = "Good Focus";
      badgeText = "✅ Productive Session";
      colorClass = "text-focus-green"; 
    } else if (finalScore >= 60) {
      categoryTitle = "Needs Improvement";
      badgeText = "⚠ Needs More Consistency";
      colorClass = "text-warning-yellow";
    } else {
      categoryTitle = "Poor Focus";
      badgeText = "🔄 Refocus Required";
      colorClass = "text-alert-red";
    }

    // Monitoring Quality
    const monitoringConfidence = ((totalSessionDuration - m.faceLostTime) / totalSessionDuration) * 100;
    const faceDetectionRate = Math.round(monitoringConfidence);
    
    let qualityLabel = "";
    if (faceDetectionRate >= 95) qualityLabel = "Excellent Monitoring";
    else if (faceDetectionRate >= 80) qualityLabel = "Good Monitoring";
    else qualityLabel = "Monitoring Quality Low";

    const insight = generateInsight(m.alertCount, m.warningCount, m.faceLostTime, totalSessionDuration);

    const focusPercentage = Math.round(focusRatio * 100);

    window.sessionReport = {
      score: finalScore,
      focusTime: m.focusTime,
      distractedTime: m.distractedTime,
      faceLostTime: m.faceLostTime,
      warningCount: m.warningCount,
      alertCount: m.alertCount,
      badge: badgeText,
      insight: insight,
      monitoringQuality: qualityLabel,
      sessionEvents: m.sessionEvents
    };

    // Save to LocalStorage
    const history = loadSessionHistory();
    history.push({
      id: "session_" + Date.now(),
      timestamp: Date.now(),
      score: finalScore,
      monitoringConfidence: faceDetectionRate,
      sessionDuration: totalSessionDuration,
      focusTime: m.focusTime,
      distractedTime: m.distractedTime,
      faceLostTime: m.faceLostTime,
      focusPercentage: focusPercentage,
      warnings: m.warningCount,
      alerts: m.alertCount
    });

    if (history.length > 20) {
      history.shift();
    }
    saveSessionHistory(history);

    showSessionReport(title, categoryTitle, colorClass, faceDetectionRate, totalActiveTime, totalSessionDuration, focusPercentage);
  }

  function showSessionReport(title, categoryTitle, colorClass, faceDetectionRate, totalActiveTime, totalSessionDuration, focusPercentage) {
    const modal = document.getElementById('sessionReportModal');
    const r = window.sessionReport;

    document.getElementById('reportTitle').textContent = title;
    
    const pRating = document.getElementById('reportRating');
    pRating.textContent = categoryTitle;
    pRating.className = `font-mono text-sm font-bold ${colorClass}`;

    document.getElementById('reportScoreValue').textContent = r.score;
    document.getElementById('reportScoreValue').className = `text-7xl font-display font-bold tabular-nums drop-shadow-md ${colorClass}`;
    
    const badgeEl = document.getElementById('reportBadge');
    badgeEl.textContent = r.badge;
    badgeEl.className = `px-4 py-1.5 rounded-full border font-mono text-sm tracking-wide ${colorClass} border-current bg-black/30 text-center`;

    const formatDur = (s) => {
      const min = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    };

    document.getElementById('reportFocusTime').textContent = formatDur(r.focusTime);
    document.getElementById('reportDistractedTime').textContent = formatDur(r.distractedTime);
    document.getElementById('reportFaceLostTime').textContent = formatDur(r.faceLostTime);
    document.getElementById('reportWarnings').textContent = r.warningCount;
    document.getElementById('reportAlerts').textContent = r.alertCount;

    // Quality
    const reportQualityLabel = document.getElementById('reportQualityLabel');
    reportQualityLabel.textContent = r.monitoringQuality;
    reportQualityLabel.className = faceDetectionRate >= 95 ? "font-bold text-focus-green text-sm" : faceDetectionRate >= 80 ? "font-bold text-[#EAB308] text-sm" : faceDetectionRate >= 60 ? "font-bold text-warning-yellow text-sm" : "font-bold text-alert-red text-sm";
    
    document.getElementById('reportQualityPercent').textContent = faceDetectionRate + "%";
    
    const qualWarn = document.getElementById('reportQualityWarning');
    if (r.faceLostTime > 0.2 * totalSessionDuration) {
      qualWarn.classList.remove('hidden');
    } else {
      qualWarn.classList.add('hidden');
    }

    // Progress Bars
    let focusPct = 0;
    let distPct = 0;
    if (totalActiveTime > 0) {
      focusPct = focusPercentage;
      distPct = 100 - focusPct;
    }
    document.getElementById('reportFocusPercent').textContent = focusPct + "%";
    document.getElementById('reportFocusBar').style.width = focusPct + "%";
    document.getElementById('reportDistractPercent').textContent = distPct + "%";
    document.getElementById('reportDistractBar').style.width = distPct + "%";

    // Insight
    document.getElementById('reportInsightText').textContent = r.insight;

    // Timeline
    const tlContainer = document.getElementById('reportTimeline');
    tlContainer.innerHTML = '';
    r.sessionEvents.forEach(ev => {
      let color = "text-white/80";
      if (ev.type === "WARNING") color = "text-warning-yellow";
      if (ev.type === "ALERT") color = "text-alert-red";
      if (ev.type === "SESSION_START" || ev.type === "SESSION_COMPLETE") color = "text-focus-green";

      const div = document.createElement('div');
      div.className = "flex gap-4 border-b border-white/5 pb-2 last:border-0";
      div.innerHTML = `<span class="text-white/40 min-w-[40px]">${ev.timestamp}</span><span class="${color}">${ev.type.replace('_', ' ')}</span>`;
      tlContainer.appendChild(div);
    });

    modal.classList.remove('hidden');
  }

  // Modal event listeners
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnNewSession = document.getElementById('btnNewSession');
  const modal = document.getElementById('sessionReportModal');
  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (btnNewSession && modal) {
    btnNewSession.addEventListener('click', () => {
      modal.classList.add('hidden');
      changeState(STATES.IDLE);
    });
  }

  // --- EXPORT GLOBALS FOR AI.JS ---
  window.getCurrentState = () => currentState;
  window.changeState = (newState) => {
    if (STATES[newState]) {
      changeState(STATES[newState]);
    }
  };
  window.updateTelemetryUI = updateTelemetryUI;
});