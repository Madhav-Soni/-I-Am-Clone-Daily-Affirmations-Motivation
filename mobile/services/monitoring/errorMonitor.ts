import { Platform } from "react-native";

// Custom type to bypass standard React Native ErrorUtils definition restrictions
interface GlobalErrorUtils {
  setGlobalHandler: (callback: (error: Error, isFatal: boolean) => void) => void;
  getGlobalHandler: () => (error: Error, isFatal: boolean) => void;
}

declare const global: {
  ErrorUtils?: GlobalErrorUtils;
};

/**
 * Strips user identity properties and secrets to preserve absolute privacy
 */
export const redactPII = (data: any): any => {
  if (!data) return data;
  if (typeof data === "string") {
    // Redact Bearer tokens
    let redacted = data.replace(/bearer\s+[a-zA-Z0-9._%+-=]+/gi, "[TOKEN_REDACTED]");
    // Redact raw emails
    redacted = redacted.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]");
    return redacted;
  }
  if (Array.isArray(data)) {
    return data.map(redactPII);
  }
  if (typeof data === "object") {
    const copy: any = {};
    for (const key of Object.keys(data)) {
      if (
        [
          "token",
          "accessToken",
          "refreshToken",
          "email",
          "name",
          "note",
          "moodNote",
          "reflections",
          "content",
          "mood"
        ].includes(key)
      ) {
        copy[key] = "[REDACTED_PII]";
      } else {
        copy[key] = redactPII(data[key]);
      }
    }
    return copy;
  }
  return data;
};

export const errorMonitor = {
  init: () => {
    if (__DEV__) {
      console.log("[ErrorMonitor] Initialized in development mode.");
      return;
    }

    // Capture standard uncaught Javascript runtime exceptions in release builds
    const globalHandler = (error: Error, isFatal: boolean) => {
      errorMonitor.logError(error, { isFatal, source: "global" });
    };

    if (global.ErrorUtils) {
      global.ErrorUtils.setGlobalHandler(globalHandler);
    }
  },

  logError: (error: any, context?: any) => {
    const sanitizedContext = redactPII(context || {});
    const sanitizedMsg = typeof error === "string" 
      ? redactPII(error) 
      : redactPII(error?.message || "Unknown client error");

    if (__DEV__) {
      console.warn(`[ErrorMonitor Logged Error]: ${sanitizedMsg}`, sanitizedContext);
    } else {
      // In production builds, log to standard stdout streams/Sentry buffer safely
      console.log(
        JSON.stringify({
          level: "error",
          message: sanitizedMsg,
          context: sanitizedContext,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        })
      );
    }
  },

  logBreadcrumb: (message: string, category?: string) => {
    const sanitized = redactPII(message);
    if (__DEV__) {
      console.log(`[Breadcrumb - ${category || "info"}]: ${sanitized}`);
    } else {
      console.log(
        JSON.stringify({
          level: "info",
          type: "breadcrumb",
          category: category || "info",
          message: sanitized,
          timestamp: new Date().toISOString(),
        })
      );
    }
  },
};
