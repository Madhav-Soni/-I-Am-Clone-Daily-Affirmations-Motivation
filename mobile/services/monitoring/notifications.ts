import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { errorMonitor } from "./errorMonitor";

// Set default incoming notification behavior (heads-up notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notifications = {
  /**
   * Request user permission for push notifications and return token
   */
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    if (Platform.OS === "web") return null;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      // Safe get Expo Push Token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (err: any) {
      errorMonitor.logError(err, { source: "notifications-register" });
      return null;
    }
  },

  /**
   * Schedules a daily recurring notification at a specific time in user's local timezone.
   * e.g., reminderTime = "08:00"
   */
  scheduleDailyReminder: async (reminderTime: string = "08:00") => {
    if (Platform.OS === "web") return;

    try {
      // 1. Cancel existing reminders to avoid duplication
      await Notifications.cancelAllScheduledNotificationsAsync();

      const [hoursStr, minutesStr] = reminderTime.split(":");
      const hours = parseInt(hoursStr, 10) || 8;
      const minutes = parseInt(minutesStr, 10) || 0;

      // 2. Schedule timezone-aware daily local reminder
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌿 Daily Ritual Sanctuary",
          body: "Breathe in, breathe out. A fresh morning affirmation is waiting to align your focus today.",
          data: { category: "ritual_reminder" },
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });

      errorMonitor.logBreadcrumb(`Daily reminder scheduled successfully for ${reminderTime}`, "notifications");
    } catch (err: any) {
      errorMonitor.logError(err, { source: "notifications-schedule", reminderTime });
    }
  },

  /**
   * Schedules a streak recovery reminder to preserve their daily consistency
   */
  scheduleStreakRecoveryReminder: async () => {
    if (Platform.OS === "web") return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✨ Keep Your Rhythm",
          body: "Take a gentle pause today to continue your generation ritual and protect your daily streak.",
          data: { category: "streak_recovery" },
          sound: true,
        },
        // Trigger in exactly 22 hours from now to give them ample warning
        trigger: {
          seconds: 22 * 60 * 60,
        } as any,
      });
    } catch (err: any) {
      errorMonitor.logError(err, { source: "notifications-streak-recovery" });
    }
  },
};
