import { Stack } from "expo-router";

export default function LibraryStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0f172a" },
      }}
    />
  );
}
