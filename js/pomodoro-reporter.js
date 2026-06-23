window.FocusGuard = window.FocusGuard || {};

window.FocusGuard.Reporter = {
  init: function() {
    window.getMonitoringTierInfo = this.getMonitoringTierInfo.bind(this);
    this.bindModalListeners();
  },

  getMonitoringTierInfo: function(score) {
    const val = typeof score === 'number' ? score : 0;
    if (val >= 90) return { label: "Excellent Monitoring", level: "Excellent", colorClass: "text-focus-green", badgeClass: "bg-focus-green/20 text-focus-green border-focus-green/30" };
    if (val >= 70) return { label: "Good Monitoring", level: "Good", colorClass: "text-green-400", badgeClass: "bg-green-400/20 text-green-400 border-green-400/30" };
    if (val >= 50) return { label: "Fair Monitoring", level: "Fair", colorClass: "text-warning-yellow", badgeClass: "bg-warning-yellow/20 text-warning-yellow border-warning-yellow/30" };
    return { label: "Poor Monitoring", level: "Poor", colorClass: "text-alert-red", badgeClass: "bg-alert-red/20 text-alert-red border-alert-red/30" };
  },

  loadSessionHistory: function() {
    try {
      const userEmail = window.RoleManager && window.RoleManager.getEmail ? window.RoleManager.getEmail() : 'guest';
      const data = localStorage.getItem('focusGuardHistory_' + userEmail);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSessionHistory: function(historyArray) {
    try {
      const userEmail = window.RoleManager && window.RoleManager.getEmail ? window.RoleManager.getEmail() : 'guest';
      localStorage.setItem('focusGuardHistory_' + userEmail, JSON.stringify(historyArray));
    } catch (e) {
      console.warn("Gagal menyimpan ke LocalStorage", e);
    }
  },

  generateInsight: function(focusScore, monitoringConfidence, faceLostPercentage) {
    if (focusScore >= 90 && monitoringConfidence >= 90) return "Excellent sustained concentration throughout the session.";
    if (focusScore >= 70 && monitoringConfidence < 50) return "Focus appeared acceptable, but monitoring quality was insufficient for high confidence.";
    if (faceLostPercentage > 40) return "Large portions of the session could not be monitored because the face was not visible.";
    if (focusScore < 50) return "Frequent distractions were detected during the session.";
    return "Good effort! Maintain this focus and ensure your face is clearly visible.";
  },

  generateSessionReport: function(title, status = "completed") {
    if (!window.sessionMetrics || !window.sessionMetrics.isActive) return;
    window.sessionMetrics.isActive = false; 
    
    if (window.FocusEnvironment) window.FocusEnvironment.stop();

    window.sessionMetrics.sessionEvents.push({ type: "SESSION_COMPLETE", timestamp: window.FocusGuard.Core.getCurrentSessionTime() });

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
      if(p) { p.textContent = "Score Not Available"; p.className = "font-mono text-sm font-bold text-white/50"; }
      modal.classList.remove('hidden');
      return;
    }

    document.getElementById('reportContentContainer').classList.remove('hidden');
    document.getElementById('reportEdgeWarning').classList.add('hidden');

    const observedTime = m.focusTime + m.distractedTime;
    let focusRatio = observedTime > 0 ? m.focusTime / observedTime : 0;
    
    let baseScore = focusRatio * 100;
    const warningPenalty = m.warningCount * 2;
    const alertPenalty = m.alertCount * 5;
    
    let finalScore = Math.round(baseScore - warningPenalty - alertPenalty);
    finalScore = Math.max(0, Math.min(finalScore, 100));

    let categoryTitle = ""; let badgeText = ""; let colorClass = "";
    
    if (finalScore >= 90) { categoryTitle = "Excellent Focus"; badgeText = "🏆 Deep Work Master"; colorClass = "text-focus-green"; }
    else if (finalScore >= 75) { categoryTitle = "Good Focus"; badgeText = "✅ Productive Session"; colorClass = "text-focus-green"; }
    else if (finalScore >= 60) { categoryTitle = "Needs Improvement"; badgeText = "⚠ Needs More Consistency"; colorClass = "text-warning-yellow"; }
    else { categoryTitle = "Poor Focus"; badgeText = "🔄 Refocus Required"; colorClass = "text-alert-red"; }

    const monitoringConfidence = ((totalSessionDuration - m.faceLostTime) / Math.max(totalSessionDuration, 1)) * 100;
    const faceDetectionRate = Math.round(monitoringConfidence);
    
    let confidenceLevel = "";
    if (faceDetectionRate >= 90) confidenceLevel = "Excellent";
    else if (faceDetectionRate >= 70) confidenceLevel = "Good";
    else if (faceDetectionRate >= 50) confidenceLevel = "Fair";
    else confidenceLevel = "Poor";

    if (status === "aborted") {
      categoryTitle = "SESSION ENDED EARLY";
      badgeText = "⚠ Partial Result";
      colorClass = "text-warning-yellow";
    }

    let sessionType = status;
    if (faceDetectionRate < 20 || totalSessionDuration < 30) {
      sessionType = "invalid";
    }

    const isReliableSession = (sessionType === "completed" && faceDetectionRate >= 50);
    const faceLostPercentage = (m.faceLostTime / Math.max(totalSessionDuration, 1)) * 100;
    const insight = this.generateInsight(finalScore, faceDetectionRate, faceLostPercentage);
    const focusPercentage = Math.round(focusRatio * 100);

    window.sessionReport = {
      score: finalScore, focusTime: m.focusTime, distractedTime: m.distractedTime,
      faceLostTime: m.faceLostTime, warningCount: m.warningCount, alertCount: m.alertCount,
      badge: badgeText, insight: insight, monitoringQuality: faceDetectionRate,
      confidenceLevel: confidenceLevel, sessionEvents: m.sessionEvents, goal: m.goal || "General Focus Session",
      environmentType: m.environmentType || "None", status: status
    };

    const history = this.loadSessionHistory();
    history.push({
      id: "session_" + Date.now(), timestamp: Date.now(), status: status, sessionType: sessionType,
      isReliableSession: isReliableSession, score: finalScore, monitoringQuality: faceDetectionRate,
      confidenceLevel: confidenceLevel, sessionDuration: totalSessionDuration, focusTime: m.focusTime,
      distractedTime: m.distractedTime, faceLostTime: m.faceLostTime, warnings: m.warningCount,
      alerts: m.alertCount, badge: badgeText, focusPercentage: focusPercentage,
      goal: m.goal || "General Focus Session", environmentType: m.environmentType || "None",
      insight: insight, eventTimeline: m.sessionEvents
    });

    if (history.length > 20) history.shift();
    this.saveSessionHistory(history);

    this.showSessionReport(title, categoryTitle, colorClass, faceDetectionRate, totalActiveTime, totalSessionDuration, focusPercentage);
  },

  showSessionReport: function(title, categoryTitle, colorClass, faceDetectionRate, totalActiveTime, totalSessionDuration, focusPercentage) {
    const modal = document.getElementById('sessionReportModal');
    const r = window.sessionReport;

    document.getElementById('reportTitle').textContent = title;
    const reportGoalEl = document.getElementById('reportGoal');
    if (reportGoalEl) reportGoalEl.textContent = r.goal || "General Focus Session";

    const pRating = document.getElementById('reportRating');
    pRating.textContent = categoryTitle;
    pRating.className = `font-mono text-sm font-bold ${colorClass}`;

    document.getElementById('reportScoreValue').textContent = r.score;
    document.getElementById('reportScoreValue').className = `text-7xl font-display font-bold tabular-nums drop-shadow-md ${colorClass}`;
    
    const badgeEl = document.getElementById('reportBadge');
    badgeEl.textContent = r.badge;
    badgeEl.className = `px-4 py-1.5 rounded-full border font-mono text-sm tracking-wide ${colorClass} border-current bg-black/30 text-center`;

    const formatDur = (s) => { const min = Math.floor(s / 60); const sec = Math.floor(s % 60); return min > 0 ? `${min}m ${sec}s` : `${sec}s`; };

    document.getElementById('reportFocusTime').textContent = formatDur(r.focusTime);
    document.getElementById('reportDistractedTime').textContent = formatDur(r.distractedTime);
    document.getElementById('reportFaceLostTime').textContent = formatDur(r.faceLostTime);
    document.getElementById('reportWarnings').textContent = r.warningCount;
    document.getElementById('reportAlerts').textContent = r.alertCount;

    const reportQualityLabel = document.getElementById('reportQualityLabel');
    reportQualityLabel.textContent = r.monitoringQuality;
    reportQualityLabel.className = faceDetectionRate >= 90 ? "font-bold text-focus-green text-sm" : faceDetectionRate >= 70 ? "font-bold text-green-400 text-sm" : faceDetectionRate >= 40 ? "font-bold text-warning-yellow text-sm" : "font-bold text-alert-red text-sm";
    
    document.getElementById('reportQualityPercent').textContent = faceDetectionRate + "%";
    
    const qualWarn = document.getElementById('reportQualityWarning');
    if (r.faceLostTime > 0.2 * totalSessionDuration) qualWarn.classList.remove('hidden');
    else qualWarn.classList.add('hidden');

    let focusPct = 0; let distPct = 0;
    if (totalActiveTime > 0) { focusPct = focusPercentage; distPct = 100 - focusPct; }
    document.getElementById('reportFocusPercent').textContent = focusPct + "%";
    document.getElementById('reportFocusBar').style.width = focusPct + "%";
    document.getElementById('reportDistractPercent').textContent = distPct + "%";
    document.getElementById('reportDistractBar').style.width = distPct + "%";

    document.getElementById('reportInsightText').textContent = r.insight;

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

    if (faceDetectionRate < 50) document.getElementById('reportLowConfidenceWarning').classList.remove('hidden');
    else document.getElementById('reportLowConfidenceWarning').classList.add('hidden');

    modal.classList.remove('hidden');
  },

  renderAnalytics: function() {
    const history = this.loadSessionHistory();
    const emptyState = document.getElementById('analytics-empty-state');
    const content = document.getElementById('analytics-content');
    
    if (!history || history.length === 0) {
      if(emptyState) emptyState.classList.remove('hidden');
      if(content) content.classList.add('hidden');
      return;
    }
    
    if(emptyState) emptyState.classList.add('hidden');
    if(content) content.classList.remove('hidden');

    let totalScore = 0; let totalMonitoring = 0; let bestScore = 0;
    const reliableHistory = history.filter(s => s.isReliableSession === true);

    reliableHistory.forEach(session => {
      totalScore += session.score || 0;
      totalMonitoring += session.monitoringQuality || session.monitoringConfidence || 0;
      if ((session.score || 0) > bestScore) bestScore = session.score || 0;
    });

    const avgScore = reliableHistory.length > 0 ? Math.round(totalScore / reliableHistory.length) : "-";
    const avgMonitoring = reliableHistory.length > 0 ? Math.round(totalMonitoring / reliableHistory.length) + "%" : "-";
    const totalSessionsLabel = reliableHistory.length > 0 ? reliableHistory.length : "0";
    const bestScoreLabel = reliableHistory.length > 0 ? bestScore : "-";

    document.getElementById('kpi-avg-score').textContent = avgScore;
    document.getElementById('kpi-avg-monitoring').textContent = avgMonitoring;
    document.getElementById('kpi-total-sessions').textContent = totalSessionsLabel;
    document.getElementById('kpi-best-score').textContent = bestScoreLabel;

    const tbody = document.getElementById('analytics-table-body');
    if(tbody) {
      tbody.innerHTML = '';
      const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

      sortedHistory.forEach(session => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/10 transition-colors cursor-pointer group";
        tr.setAttribute('data-session-id', session.id);
        
        tr.addEventListener('click', () => this.openSessionDetail(session.id));
        
        const dateStr = new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        const goalStr = session.goal || "General Focus Session";
        const scoreColor = session.score >= 90 ? "text-focus-green" : session.score >= 75 ? "text-focus-green" : session.score >= 60 ? "text-warning-yellow" : "text-alert-red";
        
        const monitorVal = session.monitoringQuality || session.monitoringConfidence || 0;
        const tierInfo = this.getMonitoringTierInfo(monitorVal);
        const monColor = tierInfo.colorClass;

        let statusTag = "";
        if (session.isSimulation) statusTag = `<span class="ml-2 px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">SIMULATION</span>`;
        else if (session.sessionType === "invalid") statusTag = `<span class="ml-2 px-2 py-0.5 rounded text-[8px] font-bold bg-alert-red/20 text-alert-red border border-alert-red/30">INVALID</span>`;
        else if (session.sessionType === "aborted") statusTag = `<span class="ml-2 px-2 py-0.5 rounded text-[8px] font-bold bg-warning-yellow/20 text-warning-yellow border border-warning-yellow/30">ABORTED</span>`;
        else if (session.sessionType === "completed" && !session.isReliableSession) statusTag = `<span class="ml-2 px-2 py-0.5 rounded text-[8px] font-bold bg-warning-yellow/20 text-warning-yellow border border-warning-yellow/30">PARTIAL</span>`;
        else statusTag = `<span class="ml-2 px-2 py-0.5 rounded text-[8px] font-bold bg-focus-green/20 text-focus-green border border-focus-green/30">COMPLETED</span>`;

        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-white/80 flex items-center">${dateStr} ${statusTag}</td>
          <td class="px-6 py-4 whitespace-nowrap text-white/80">${goalStr}</td>
          <td class="px-6 py-4 whitespace-nowrap"><span class="font-bold ${scoreColor}">${session.score}</span></td>
          <td class="px-6 py-4 whitespace-nowrap"><span class="${monColor}">${monitorVal}%</span></td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-white/60">${session.warnings}</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-white/60">${session.alerts}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    if (typeof window.ProductivityAnalytics !== 'undefined') {
      window.ProductivityAnalytics.updateAll(history);
    }
  },

  openSessionDetail: function(sessionId) {
    const history = this.loadSessionHistory();
    const session = history.find(s => s.id === sessionId);
    if (!session) return;

    const modal = document.getElementById('sessionDetailModal');
    if (!modal) return;

    const formatDur = (s) => { const min = Math.floor(s / 60); const sec = Math.floor(s % 60); return min > 0 ? `${min}m ${sec}s` : `${sec}s`; };
    const dateStr = new Date(session.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    
    let statusTagHTML = "";
    if (session.isSimulation) statusTagHTML = `<span class="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">SIMULATION</span>`;
    else if (session.sessionType === "invalid") statusTagHTML = `<span class="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-alert-red/20 text-alert-red border border-alert-red/30">INVALID</span>`;
    else if (session.sessionType === "aborted") statusTagHTML = `<span class="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-warning-yellow/20 text-warning-yellow border border-warning-yellow/30">ABORTED</span>`;
    else if (session.sessionType === "completed" && !session.isReliableSession) statusTagHTML = `<span class="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-warning-yellow/20 text-warning-yellow border border-warning-yellow/30">PARTIAL</span>`;
    else statusTagHTML = `<span class="ml-3 px-2 py-0.5 rounded text-[10px] font-bold bg-focus-green/20 text-focus-green border border-focus-green/30">COMPLETED</span>`;

    document.getElementById('detailRating').innerHTML = `${dateStr} ${statusTagHTML}`;
    
    const detailGoalEl = document.getElementById('detailGoal');
    if (detailGoalEl) detailGoalEl.textContent = session.goal || "General Focus Session";

    document.getElementById('detailScoreValue').textContent = session.score;
    const scoreColor = session.score >= 90 ? "text-focus-green" : session.score >= 75 ? "text-focus-green" : session.score >= 60 ? "text-warning-yellow" : "text-alert-red";
    document.getElementById('detailScoreValue').className = `text-7xl font-display font-bold tabular-nums drop-shadow-[0_0_15px_rgba(57,255,20,0.5)] ${scoreColor}`;

    const badgeEl = document.getElementById('detailBadge');
    badgeEl.textContent = session.badge || "-";
    badgeEl.className = `px-4 py-1.5 rounded-full border font-mono text-sm tracking-wide ${scoreColor} border-current bg-black/30 text-center`;

    document.getElementById('detailFocusTime').textContent = formatDur(session.focusTime);
    document.getElementById('detailDistractedTime').textContent = formatDur(session.distractedTime);
    document.getElementById('detailFaceLostTime').textContent = formatDur(session.faceLostTime);
    document.getElementById('detailWarnings').textContent = session.warnings;
    document.getElementById('detailAlerts').textContent = session.alerts;

    let monVal = Number(session.monitoringQuality);
    if (isNaN(monVal) || session.monitoringQuality === undefined) monVal = Number(session.monitoringConfidence) || 0;
    const tierInfo = this.getMonitoringTierInfo(monVal);
    
    document.getElementById('detailQualityLabel').className = `font-bold ${tierInfo.colorClass} text-sm`;
    document.getElementById('detailQualityLabel').textContent = tierInfo.label;
    document.getElementById('detailQualityPercent').textContent = monVal + "%";
    
    const badgeConf = document.getElementById('detailConfidenceBadge');
    if (badgeConf) {
      badgeConf.className = `self-start px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-widest border ${tierInfo.badgeClass}`;
      badgeConf.textContent = `Confidence: ${tierInfo.level}`;
    }
    
    if (session.faceLostTime > 0.2 * session.sessionDuration) document.getElementById('detailQualityWarning').classList.remove('hidden');
    else document.getElementById('detailQualityWarning').classList.add('hidden');

    let focusPct = session.focusPercentage || 0; let distPct = 100 - focusPct;
    document.getElementById('detailFocusPercent').textContent = focusPct + "%";
    document.getElementById('detailFocusBar').style.width = focusPct + "%";
    document.getElementById('detailDistractPercent').textContent = distPct + "%";
    document.getElementById('detailDistractBar').style.width = distPct + "%";

    document.getElementById('detailInsightText').textContent = session.insight || "Insight not available for this session.";

    const tlContainer = document.getElementById('detailTimeline');
    tlContainer.innerHTML = '';
    
    if (session.eventTimeline && session.eventTimeline.length > 0) {
      session.eventTimeline.forEach(ev => {
        let color = "text-white/80";
        if (ev.type === "WARNING") color = "text-warning-yellow";
        if (ev.type === "ALERT") color = "text-alert-red";
        if (ev.type === "SESSION_START" || ev.type === "SESSION_COMPLETE") color = "text-focus-green";

        const div = document.createElement('div');
        div.className = "flex gap-4 border-b border-white/5 pb-2 last:border-0";
        div.innerHTML = `<span class="text-white/40 min-w-[40px]">${ev.timestamp}</span><span class="${color}">${ev.type.replace('_', ' ')}</span>`;
        tlContainer.appendChild(div);
      });
    } else {
      tlContainer.innerHTML = '<span class="text-white/40">Timeline data not recorded for this session.</span>';
    }

    modal.classList.remove('hidden');
  },

  bindModalListeners: function() {
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnNewSession = document.getElementById('btnNewSession');
    const modal = document.getElementById('sessionReportModal');
    if (btnCloseModal && modal) btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
    if (btnNewSession && modal) {
      btnNewSession.addEventListener('click', () => {
        modal.classList.add('hidden');
        if (window.FocusGuard.Core) window.FocusGuard.Core.changeState('IDLE');
      });
    }

    const btnCloseDetailModal = document.getElementById('btnCloseDetailModal');
    if (btnCloseDetailModal) {
      btnCloseDetailModal.addEventListener('click', () => {
        document.getElementById('sessionDetailModal').classList.add('hidden');
      });
    }
  }
};
