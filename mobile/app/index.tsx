import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { routes } from "@/constants/routes";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useAuthGate } from "@/hooks/useAuthGate";

/**
 * Bootstrap entry — splash, hydration, then route to the correct shell.
 * Temporary default: auth welcome until gate is wired to the API.
 */
export default function BootstrapScreen() {
  const { isReady } = useBootstrap();
  const gate = useAuthGate();

  if (!isReady || gate === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  if (gate === "auth") {
    return <Redirect href={routes.auth.welcome} />;
  }

  if (gate === "onboarding") {
    return <Redirect href={routes.onboarding.intro} />;
  }

  return <Redirect href={routes.app.home} />;
}
