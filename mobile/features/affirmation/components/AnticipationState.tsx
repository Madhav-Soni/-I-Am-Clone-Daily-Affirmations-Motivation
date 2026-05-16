import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { revealAnticipationEnter } from "@/features/affirmation/animations/revealEntrance";
import { REVEAL_COPY } from "@/features/affirmation/constants/reveal";
import { Text } from "@/shared/components/primitives/Text";

export function AnticipationState() {
  return (
    <Animated.View entering={revealAnticipationEnter} style={styles.wrap}>
      <Text variant="overline" color="accent" align="center" style={styles.label}>
        {REVEAL_COPY.anticipation}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  label: {
    letterSpacing: 2.4,
    opacity: 0.9,
  },
});
