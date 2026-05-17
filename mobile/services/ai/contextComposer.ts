
export type TimeContext = "morning" | "afternoon" | "evening" | "night";

export type EmotionalContext = {
  currentMood: string;
  moodNote?: string;
  timeOfDay: TimeContext;
  streakCount: number;
  emotionalTrend?: "improving" | "stable" | "declining" | "volatile";
  recentThemes?: string[];
  avoidRepetition?: string[]; // Last 3 affirmations to avoid similar phrasing
};

/**
 * ContextComposer: Synthesizes raw user data into high-fidelity AI context.
 * This is the "Emotional Intelligence" layer of the application.
 */
export const contextComposer = {
  /**
   * Synthesizes all available signals into a structured context object.
   */
  compose(
    mood: string,
    note: string,
    streak: number,
    moodHistory: any[] = [],
    affirmationHistory: any[] = []
  ): EmotionalContext {
    const now = new Date();
    const hour = now.getHours();

    return {
      currentMood: mood,
      moodNote: note,
      timeOfDay: this.getTimeOfDay(hour),
      streakCount: streak,
      emotionalTrend: this.calculateTrend(moodHistory),
      recentThemes: this.extractThemes(affirmationHistory),
      avoidRepetition: affirmationHistory.slice(0, 3).map((a) => a.content),
    };
  },

  /**
   * Maps current hour to a situational time context.
   */
  getTimeOfDay(hour: number): TimeContext {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
  },

  /**
   * Simple heuristic to detect emotional momentum from recent logs.
   */
  calculateTrend(history: any[]): EmotionalContext["emotionalTrend"] {
    if (history.length < 3) return "stable";

    // This is a simplified placeholder for trend analysis
    // In a real app, we might map moods to "vibe scores" and check slope
    return "stable";
  },

  extractThemes(history: any[]): string[] {
    const themes: string[] = [];
    // Extract categories or keywords from history
    const recentCategories = history.slice(0, 5).map((a) => a.category);
    const unique = Array.from(new Set(recentCategories));
    return unique.filter(Boolean) as string[];
  },

  /**
   * Generates an emotional continuity greeting for the home screen.
   */
  generateHomeGreeting(recentAffirmations: any[], recentMoods: any[]): string {
    if (!recentAffirmations?.length && !recentMoods?.length) {
      return "Welcome to your personal space.";
    }

    const lastMood = recentMoods?.[0]?.mood;
    const themes = this.extractThemes(recentAffirmations);

    if (themes.length > 0) {
      const topTheme = themes[0].toLowerCase();
      return `Your recent affirmations have centered around ${topTheme}.`;
    }

    if (lastMood) {
      return `You've been feeling ${lastMood.toLowerCase()} lately.`;
    }

    return "Continue where you left off.";
  },
};
