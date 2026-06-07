// analytics.js - Productivity Insights System

window.ProductivityAnalytics = {
  
  renderTrendChart: function(history) {
    const svg = document.getElementById('trend-chart-svg');
    const badge = document.getElementById('trend-status-badge');
    const emptyState = document.getElementById('trend-empty-state');

    // Filter only reliable sessions for Trend
    const completedHistory = history ? history.filter(s => s.isReliableSession === true) : [];

    // Clear existing SVG content
    svg.innerHTML = '';

    if (completedHistory.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      svg.classList.add('hidden');
      if (badge) {
        badge.textContent = "NO DATA";
        badge.className = "px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest border text-white/40 border-white/10 bg-white/5";
      }
      return;
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      svg.classList.remove('hidden');
    }

    // We only chart up to the last 10 sessions for readability
    const maxDataPoints = 10;
    const chartData = completedHistory.slice(-maxDataPoints);
    
    // SVG coordinates
    const width = svg.clientWidth || 400;
    const height = svg.clientHeight || 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    // Draw Axes
    const xAxisY = height - padding.bottom;
    const yAxisX = padding.left;

    // Helpers
    const getX = (index) => yAxisX + (index * (innerWidth / Math.max(1, chartData.length - 1)));
    const getY = (score) => xAxisY - ((score / 100) * innerHeight);

    // Draw Grid Lines (Y-Axis: 0, 25, 50, 75, 100)
    [0, 25, 50, 75, 100].forEach(val => {
      const y = getY(val);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", yAxisX);
      line.setAttribute("y1", y);
      line.setAttribute("x2", width - padding.right);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
      line.setAttribute("stroke-width", "1");
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", yAxisX - 10);
      text.setAttribute("y", y + 4);
      text.setAttribute("fill", "rgba(255, 255, 255, 0.5)");
      text.setAttribute("font-size", "10px");
      text.setAttribute("font-family", "monospace");
      text.setAttribute("text-anchor", "end");
      text.textContent = val;

      svg.appendChild(line);
      svg.appendChild(text);
    });

    // Draw Path
    if (chartData.length > 1) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let d = `M ${getX(0)} ${getY(chartData[0].score)}`;
      for (let i = 1; i < chartData.length; i++) {
        d += ` L ${getX(i)} ${getY(chartData[i].score)}`;
      }
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#39FF14"); // focus-green
      path.setAttribute("stroke-width", "3");
      svg.appendChild(path);
    }

    // Draw Data Points
    chartData.forEach((session, i) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", getX(i));
      circle.setAttribute("cy", getY(session.score));
      circle.setAttribute("r", "5");
      circle.setAttribute("fill", "#0a0a0a");
      circle.setAttribute("stroke", "#39FF14");
      circle.setAttribute("stroke-width", "2");
      svg.appendChild(circle);
      
      const xText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      xText.setAttribute("x", getX(i));
      xText.setAttribute("y", height - 10);
      xText.setAttribute("fill", "rgba(255, 255, 255, 0.5)");
      xText.setAttribute("font-size", "10px");
      xText.setAttribute("font-family", "monospace");
      xText.setAttribute("text-anchor", "middle");
      xText.textContent = "S" + (history.length - chartData.length + i + 1);
      svg.appendChild(xText);
    });

    // Trend Logic
    if (completedHistory.length >= 2 && badge) {
      const latestSessions = completedHistory.slice(-3);
      const prevSessions = completedHistory.slice(-6, -3);
      
      const avg = arr => arr.reduce((a,b) => a + b.score, 0) / arr.length;
      
      if (prevSessions.length > 0) {
        const last3Avg = avg(latestSessions);
        const prev3Avg = avg(prevSessions);
        
        badge.className = "px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest border";
        if (last3Avg > prev3Avg) {
          badge.textContent = "IMPROVING";
          badge.classList.add("text-focus-green", "border-focus-green/50", "bg-focus-green/10");
        } else if (last3Avg < prev3Avg) {
          badge.textContent = "DECLINING";
          badge.classList.add("text-alert-red", "border-alert-red/50", "bg-alert-red/10");
        } else {
          badge.textContent = "STABLE";
          badge.classList.add("text-blue-400", "border-blue-400/50", "bg-blue-400/10");
        }
      } else {
        // Not enough data for trend
        badge.textContent = "STABLE";
        badge.className = "px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest border text-blue-400 border-blue-400/50 bg-blue-400/10";
      }
    } else if (badge) {
      badge.textContent = "STABLE";
      badge.className = "px-3 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest border text-blue-400 border-blue-400/50 bg-blue-400/10";
    }
  },

  renderAchievements: function(history) {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;
    
    // checkAchievements and getAchievements are in history.js
    let achievements = [];
    if (typeof window.checkAchievements === 'function') {
      achievements = window.checkAchievements(history) || [];
    } else if (typeof window.getAchievements === 'function') {
      achievements = window.getAchievements();
    }
    
    grid.innerHTML = '';

    // Calculate progression text based on reliable history
    const reliableHistory = history.filter(s => s.isReliableSession === true);

    const getProgress = (id) => {
      switch(id) {
        case "first_session": return reliableHistory.length > 0 ? "1 / 1" : "0 / 1";
        case "getting_started": return `${Math.min(reliableHistory.length, 5)} / 5 Sessions`;
        case "dedicated": return `${Math.min(reliableHistory.length, 10)} / 10 Sessions`;
        case "consistent_performer": 
            let streak = 0;
            for(let i = reliableHistory.length - 1; i >= 0; i--) {
                if(reliableHistory[i].score >= 80) streak++;
                else break;
            }
            return `${Math.min(streak, 3)} / 3 Streak`;
        default: return "";
      }
    };

    const badgeIcons = {
      "first_session": "🏆",
      "getting_started": "🏆",
      "dedicated": "🏆",
      "sharp_focus": "🎯",
      "consistent_performer": "🔥",
      "monitoring_master": "📷"
    };

    achievements.forEach(ach => {
      const card = document.createElement('div');
      const progressText = getProgress(ach.id);
      
      if (ach.unlocked) {
        const dateStr = new Date(ach.unlockedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
        card.className = "flex items-center gap-3 p-3 rounded-lg border border-focus-green/50 bg-focus-green/5 shadow-[0_0_10px_rgba(57,255,20,0.1)] transition-all";
        card.innerHTML = `
          <div class="text-2xl">${badgeIcons[ach.id] || "🏆"}</div>
          <div class="flex-1">
            <h4 class="text-sm font-bold text-focus-green">${ach.title}</h4>
            <p class="text-[10px] text-focus-green/70 font-mono mt-0.5">Unlocked: ${dateStr}</p>
          </div>
        `;
      } else {
        card.className = "flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 opacity-40 grayscale transition-all";
        card.innerHTML = `
          <div class="text-2xl">🔒</div>
          <div class="flex-1">
            <h4 class="text-sm font-bold text-white/70">${ach.title}</h4>
            ${progressText ? `<p class="text-[10px] text-white/40 font-mono mt-0.5">${progressText}</p>` : ''}
          </div>
        `;
      }
      grid.appendChild(card);
    });
  },

  generateInsight: function(history) {
    const panel = document.getElementById('analytics-insight-panel');
    const textEl = document.getElementById('insight-text');
    if (!panel || !textEl || !history || history.length === 0) {
      if (panel) panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');
    let insight = "Keep going! Complete more sessions to unlock deep insights into your productivity patterns.";

    const latest = history[history.length - 1];
    const prev = history.length > 1 ? history[history.length - 2] : null;

    // Insight Priority Engine v2
    const score = latest.score || 0;
    const monitoring = latest.monitoringQuality || 0;
    const faceLostPercent = (latest.faceLostTime / Math.max(latest.sessionDuration, 1)) * 100;
    const warnings = latest.warnings || 0;
    const alerts = latest.alerts || 0;
    
    // Previous reliable session for trend
    const reliableHistory = history.filter(s => s.isReliableSession === true);
    let prevScore = null;
    if (reliableHistory.length >= 2) {
      // the last one is either the current one (if reliable) or previous
      const currentIsReliable = latest.isReliableSession;
      if (currentIsReliable) {
        prevScore = reliableHistory[reliableHistory.length - 2].score;
      } else {
        prevScore = reliableHistory[reliableHistory.length - 1].score;
      }
    }

    // 1. Excellent Focus
    if (score >= 90 && monitoring >= 90) {
      insight = "Excellent sustained concentration throughout the session.";
    } 
    // 2. Low Confidence
    else if (score >= 70 && monitoring < 50) {
      insight = "Focus appeared acceptable, but monitoring quality was insufficient for high confidence.";
    }
    // 3. Frequent Face Loss
    else if (faceLostPercent > 40) {
      insight = "Large portions of the session could not be monitored because the face was not visible.";
    }
    // 4. High Warning Count
    else if (warnings >= 3) {
      insight = "Several distraction events were detected during the session.";
    }
    // 5. High Alert Count
    else if (alerts >= 2) {
      insight = "Extended periods of distraction were observed.";
    }
    // 6. Improvement Trend
    else if (prevScore !== null && score > prevScore) {
      insight = "Your focus performance improved compared to the previous reliable session.";
    }
    // 7. Declining Trend
    else if (prevScore !== null && score < prevScore) {
      insight = "Your focus performance has declined compared to recent sessions.";
    }
    // Fallback
    else {
      insight = "Consistent session completed. Keep tracking to uncover deeper productivity patterns.";
    }

    textEl.textContent = insight;
  },

  updateAll: function(history) {
    this.renderTrendChart(history);
    this.renderAchievements(history);
    this.generateInsight(history);
  }
};
