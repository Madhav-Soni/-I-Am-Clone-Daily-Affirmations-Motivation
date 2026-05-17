const Affirmation = require("../models/Affirmation");
const MoodLog = require("../models/MoodLog");
const { getLocalDateString } = require("../utils/timezoneHelper");

/**
 * Aggregates all user-related state into a single unified hydration payload for the today screen.
 */
exports.getTodaySessionState = async (user, localHour) => {
  const userId = user._id;
  const now = new Date();

  // Run parallel fetches for latest details
  const [latestAffirmation, recentMood, recentAffirmations, recentMoodLogs] = await Promise.all([
    Affirmation.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    MoodLog.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    Affirmation.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    MoodLog.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  // 1. Compassion Recovery State
  const compassionRecoveryState = user.streakCount === 1 && (user.lifetimeRitualCount || 0) > 1;

  // 2. Ritual Completion Today
  const timezone = user.timezone || "UTC";
  const todayStr = getLocalDateString(now, timezone);
  const lastActiveStr = getLocalDateString(user.lastActiveAt || new Date(0), timezone);
  const ritualCompletionToday = todayStr === lastActiveStr;

  // 3. Time-of-day Tone
  let timeOfDayTone = "morning";
  if (localHour >= 5 && localHour < 12) timeOfDayTone = "morning";
  else if (localHour >= 12 && localHour < 18) timeOfDayTone = "afternoon";
  else if (localHour >= 18 && localHour < 22) timeOfDayTone = "evening";
  else timeOfDayTone = "night";

  // 4. Emotional Continuity Message (Trajectory analysis)
  const recentCategories = recentAffirmations.map((a) => a.category).filter(Boolean);
  const uniqueCategories = [...new Set(recentCategories)];

  let emotionalContinuityMessage = "Welcome to your personal space.";

  if (recentMoodLogs && recentMoodLogs.length > 0) {
    const positiveMoods = ["Happy", "Excited", "Calm", "Hopeful", "Grateful"];
    const negativeMoods = ["Sad", "Anxious", "Tired", "Frustrated", "Overwhelmed"];

    const scores = recentMoodLogs.map(log => {
      if (positiveMoods.includes(log.mood)) return 1;
      if (negativeMoods.includes(log.mood)) return -1;
      return 0;
    });

    const anxietyLogsCount = recentMoodLogs.filter(log => ["Anxious", "Overwhelmed"].includes(log.mood)).length;

    let trajectory = "stable";
    if (anxietyLogsCount >= 3) {
      trajectory = "persistently anxious";
    } else if (scores.length >= 2) {
      const reversedScores = [...scores].reverse();
      let isImproving = true;
      let isDeclining = true;
      for (let i = 1; i < reversedScores.length; i++) {
        if (reversedScores[i] < reversedScores[i - 1]) isImproving = false;
        if (reversedScores[i] > reversedScores[i - 1]) isDeclining = false;
      }
      if (isImproving && reversedScores[reversedScores.length - 1] > reversedScores[0]) trajectory = "improving";
      else if (isDeclining && reversedScores[reversedScores.length - 1] < reversedScores[0]) trajectory = "declining";
      else {
        let changes = 0;
        for (let i = 1; i < reversedScores.length; i++) {
          if (reversedScores[i] !== reversedScores[i - 1]) changes++;
        }
        if (changes >= 3) trajectory = "volatile";
      }
    }

    const lastMood = recentMoodLogs[0].mood.toLowerCase();

    if (trajectory === "persistently anxious") {
      emotionalContinuityMessage = "Steadying your space today.";
    } else if (trajectory === "declining") {
      emotionalContinuityMessage = "A slow, restorative moment.";
    } else if (trajectory === "improving") {
      emotionalContinuityMessage = "Your momentum is rising.";
    } else if (trajectory === "volatile") {
      emotionalContinuityMessage = "Centering your calm today.";
    } else {
      emotionalContinuityMessage = `Feeling ${lastMood}, let's center.`;
    }
  } else if (uniqueCategories.length > 0) {
    const topTheme = uniqueCategories[0].toLowerCase();
    emotionalContinuityMessage = `Centering on ${topTheme} today.`;
  }

  // 5. Reflection Callback
  let reflectionCallback = null;
  if (recentMood && recentMood.note) {
    reflectionCallback = `Last check-in you wrote: "${recentMood.note}"`;
  }

  // 6. Suggested Emotional Direction
  let suggestedEmotionalDirection = "General";
  if (recentMood) {
    const moodUpper = recentMood.mood.toUpperCase();
    if (["ANXIOUS", "STRESSED", "OVERWHELMED"].includes(moodUpper)) {
      suggestedEmotionalDirection = "Mindfulness";
    } else if (["SAD", "DOWN", "TIRED"].includes(moodUpper)) {
      suggestedEmotionalDirection = "Confidence";
    } else if (["HAPPY", "EXCITED", "CALM"].includes(moodUpper)) {
      suggestedEmotionalDirection = "Gratitude";
    }
  }

  return {
    latestAffirmation: latestAffirmation || null,
    recentMood: recentMood || null,
    emotionalContinuityMessage,
    streakState: user.streakCount,
    compassionRecoveryState,
    lifetimeRituals: user.lifetimeRitualCount || 0,
    ritualCompletionToday,
    timeOfDayTone,
    reflectionCallback,
    suggestedEmotionalDirection,
  };
};
