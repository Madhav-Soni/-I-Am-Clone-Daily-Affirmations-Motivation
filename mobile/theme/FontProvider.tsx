import { useFonts } from "expo-font";
import type { ReactNode } from "react";
import { View, ActivityIndicator } from "react-native";
import { fontAssets } from "./fonts";
import { colors } from "./tokens";

type FontProviderProps = {
  children: ReactNode;
};

export function FontProvider({ children }: FontProviderProps) {
  const [loaded] = useFonts(fontAssets);

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.luxury.void,
        }}
      >
        <ActivityIndicator color={colors.luxury.accentSoft} />
      </View>
    );
  }

  return <>{children}</>;
}
