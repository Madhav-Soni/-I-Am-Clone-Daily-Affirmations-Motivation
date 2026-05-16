import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "fullScreenModal",
        animation: "fade_from_bottom",
        gestureEnabled: true,
        contentStyle: { backgroundColor: "#030508" },
      }}
    />
  );
}
