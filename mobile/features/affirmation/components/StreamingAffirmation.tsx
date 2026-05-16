import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useFloat } from "@/animations/hooks";
import { useTypewriterCursor } from "@/animations/hooks/useTypewriterCursor";
import { revealTextEnter } from "@/features/affirmation/animations/revealEntrance";
import { GlassCard } from "@/shared/components/primitives/GlassCard";
import { Text } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";
import { fontFamily } from "@/theme/typography";

type StreamingAffirmationProps = {
  text: string;
  isStreaming: boolean;
  showReflection?: boolean;
};

export function StreamingAffirmation({
  text,
  isStreaming,
  showReflection = false,
}: StreamingAffirmationProps) {
  const floatStyle = useFloat({ amplitude: 5, durationMs: 7000, delayMs: 200 });
  const { cursorStyle } = useTypewriterCursor(isStreaming);

  return (
    <Animated.View entering={revealTextEnter} style={styles.wrap}>
      <Animated.View style={floatStyle}>
        <GlassCard animated={false} padding="lg" intensity={52}>
          <Text variant="affirmation" color="primary" align="center" style={styles.affirmation}>
            {text}
            {isStreaming ? (
              <Animated.Text style={[styles.cursor, cursorStyle]}>|</Animated.Text>
            ) : null}
          </Text>
          {showReflection ? (
            <Text variant="caption" color="accent" align="center" style={styles.reflection}>
              Let this land softly.
            </Text>
          ) : null}
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    paddingHorizontal: 4,
  },
  affirmation: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    lineHeight: 38,
  },
  cursor: {
    color: colors.luxury.accentSoft,
    fontFamily: fontFamily.display,
    fontSize: 26,
  },
  reflection: {
    marginTop: 20,
    fontStyle: "italic",
    opacity: 0.85,
  },
});
