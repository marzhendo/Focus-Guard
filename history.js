// history.js - Achievement Tracking & Persistence

window.focusGuardAchievements = window.focusGuardAchievements || {};

const DEFAULT_ACHIEVEMENTS = [
  { id: "first_session", title: "First Session", description: "Complete your very first focus session.", unlocked: false, unlockedAt: null },
  { id: "getting_started", title: "Getting Started", description: "Complete 5 focus sessions.", unlocked: false, unlockedAt: null },
  { id: "dedicated", title: "Dedicated", description: "Complete 10 focus sessions.", unlocked: false, unlockedAt: null },
  { id: "sharp_focus", title: "Sharp Focus", description: "Achieve a Focus Score of 90 or above.", unlocked: false, unlockedAt: null },
  { id: "consistent_performer", title: "Consistent Performer", description: "Score 80+ in 3 consecutive sessions.", unlocked: false, unlockedAt: null },
  { id: "monitoring_master", title: "Monitoring Master", description: "Maintain 95%+ monitoring confidence.", unlocked: false, unlockedAt: null }
];

function loadAchievements() {
  try {
    const data = localStorage.getItem("focusGuardAchievements");
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all keys exist
      return DEFAULT_ACHIEVEMENTS.map(def => {
        const found = parsed.find(a => a.id === def.id);
        return found ? { ...def, ...found } : def;
      });
    }
  } catch (e) {
    console.warn("Failed to load achievements", e);
  }
  return [...DEFAULT_ACHIEVEMENTS];
}

function saveAchievements(achievements) {
  try {
    localStorage.setItem("focusGuardAchievements", JSON.stringify(achievements));
  } catch (e) {
    console.warn("Failed to save achievements", e);
  }
}

window.checkAchievements = function(history) {
  if (!history || history.length === 0) return;
  
  const achievements = loadAchievements();
  
  // Feature 3: Achievement Hardening - Only use reliable sessions for achievements
  const reliableHistory = history.filter(s => s.isReliableSession === true && s.isSimulation !== true);
  
  if (reliableHistory.length === 0) return achievements;

  const latestSession = reliableHistory[reliableHistory.length - 1];
  let updated = false;

  const unlock = (id) => {
    const ach = achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.unlockedAt = Date.now();
      updated = true;
    }
  };

  // 1. First Session
  if (reliableHistory.length >= 1) unlock("first_session");
  
  // 2. Getting Started
  if (reliableHistory.length >= 5) unlock("getting_started");
  
  // 3. Dedicated
  if (reliableHistory.length >= 10) unlock("dedicated");
  
  const latestMon = Number(latestSession.monitoringQuality || latestSession.monitoringConfidence) || 0;
  
  // 4. Sharp Focus (score >= 90 && monitoring >= 70)
  if (latestSession.score >= 90 && latestMon >= 70) unlock("sharp_focus");
  
  // 5. Consistent Performer (3 reliable sessions score >= 80)
  if (reliableHistory.length >= 3) {
    const last3 = reliableHistory.slice(-3);
    if (last3.every(s => s.score >= 80)) {
      unlock("consistent_performer");
    }
  }
  
  // 6. Monitoring Master
  if (latestMon >= 95) unlock("monitoring_master");

  if (updated) {
    saveAchievements(achievements);
  }
  
  return achievements;
};

window.getAchievements = loadAchievements;
