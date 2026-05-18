import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is missing. Please set EXPO_PUBLIC_API_URL in your environment or mobile/.env file to proceed."
    );
  }

  return {
    ...config,
    name: "I AM WELL",
    slug: "iamwell",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "iamwell",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.iamwell.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0f172a",
      },
      package: "com.iamwell.app",
    },
    web: {
      bundler: "metro",
      output: "static",
    },
    plugins: ["expo-router", "expo-font", "expo-secure-store", "expo-notifications"],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiUrl: apiUrl,
      router: {
        origin: false,
      },
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  };
};
