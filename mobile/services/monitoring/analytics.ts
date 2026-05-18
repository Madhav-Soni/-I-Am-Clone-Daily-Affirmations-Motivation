import { Platform } from "react-native";
import { redactPII } from "./errorMonitor";

export type AnalyticsEvent =
  | { name: "onboarding_completed"; properties?: { voice: string; topics: string[] } }
  | { name: "affirmation_generated"; properties?: { category: string; voice: string } }
  | { name: "cooldown_reached"; properties?: { category: string; waitTimeRemainingMs: number } }
  | { name: "streak_continued"; properties?: { currentStreak: number } }
  | { name: "share_exported"; properties?: { category: string; shareType: "text" | "card" } }
  | { name: "notification_opened"; properties?: { category: string } }
  | { name: "retention_cohort"; properties?: { cohort: string } };

export const analytics = {
  track: (event: AnalyticsEvent) => {
    const sanitizedProps = redactPII(event.properties || {});

    if (__DEV__) {
      console.log(`[Analytics Event]: ${event.name}`, sanitizedProps);
      return;
    }

    // In production, stream structured JSON payloads compatible with log collectors
    console.log(
      JSON.stringify({
        level: "info",
        type: "analytics",
        eventName: event.name,
        properties: sanitizedProps,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
export default analytics;
