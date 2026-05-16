/**
 * Route path constants for typed navigation.
 * Mirrors Expo Router file structure under app/.
 */
export const routes = {
  bootstrap: "/",
  auth: {
    welcome: "/(auth)/welcome",
    login: "/(auth)/login",
    register: "/(auth)/register",
  },
  onboarding: {
    intro: "/(onboarding)/intro",
    topics: "/(onboarding)/topics",
    voice: "/(onboarding)/voice",
    frequency: "/(onboarding)/frequency",
    complete: "/(onboarding)/complete",
  },
  app: {
    home: "/(app)/(home)",
    categoryPicker: "/(app)/(home)/category-picker",
    checkIn: "/(app)/(check-in)",
    checkInNote: "/(app)/(check-in)/note",
    library: "/(app)/(library)",
    libraryDetail: (id: string) => `/(app)/(library)/${id}` as const,
    profile: "/(app)/(profile)",
    stats: "/(app)/(profile)/stats",
  },
  modals: {
    affirmationReveal: "/(modals)/affirmation-reveal",
    streakCelebration: "/(modals)/streak-celebration",
    paywall: "/(modals)/paywall",
  },
} as const;
