const Affirmation = require("../models/Affirmation");
const MoodLog = require("../models/MoodLog");

/**
 * Aggregates all user-related state into a single unified hydration payload for the today screen.
 */
exports.getTodaySessionState = async (user, localHour) => {
  const userId = user._id;
  const now = new Date();

  // Run parallel fetches for latest details
  const [latestAffirmation, recentMood, recentAffirmations] = await Promise.all([
    Affirmation.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    MoodLog.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    Affirmation.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  // 1. Compassion Recovery State
  const compassionRecoveryState = user.streakCount === 1 && (user.lifetimeRitualCount || 0) > 1;

  // 2. Ritual Completion Today
  // Check if last active is today (same UTC calendar day or within same day window)
  const lastActive = new Date(user.lastActiveAt || now);
  const ritualCompletionToday =
    now.getUTCFullYear() === lastActive.getUTCFullYear() &&
    now.getUTCMonth() === lastActive.getUTCMonth() &&
    now.getUTCDate() === lastActive.getUTCDate();

  // 3. Time-of-day Tone
  let timeOfDayTone = "morning";
  if (localHour >= 5 && localHour < 12) timeOfDayTone = "morning";
  else if (localHour >= 12 && localHour < 18) timeOfDayTone = "afternoon";
  else if (localHour >= 18 && localHour < 22) timeOfDayTone = "evening";
  else timeOfDayTone = "night";

  // 4. Emotional Continuity Message (Thematic analysis)
  const recentCategories = recentAffirmations.map((a) => a.category).filter(Boolean);
  const uniqueCategories = [...new Set(recentCategories)];

  let emotionalContinuityMessage = "Welcome to your personal space.";
  if (uniqueCategories.length > 0) {
    const topTheme = uniqueCategories[0].toLowerCase();
    emotionalContinuityMessage = `Your recent affirmations have centered around ${topTheme}.`;
  } else if (recentMood) {
    emotionalContinuityMessage = `You've been feeling ${recentMood.mood.toLowerCase()} lately.`;
  }

  // 5. Reflection Callback
  let reflectionCallback = null;
  if (recentMood && recentMood.note) {
    // Generate a gentle reflective quote
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
