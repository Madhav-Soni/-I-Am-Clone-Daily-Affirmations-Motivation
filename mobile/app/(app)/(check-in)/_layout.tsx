import { Stack } from "expo-router";

export default function CheckInStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: "#030508" },
      }}
    />
  );
}
