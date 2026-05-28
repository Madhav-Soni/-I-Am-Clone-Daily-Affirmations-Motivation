import { StyleSheet, View } from "react-native";
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
  mood?: string;
  tone?: string;
};

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function StreamingAffirmation({
  text,
  isStreaming,
  showReflection = false,
  mood,
  tone,
}: StreamingAffirmationProps) {
  const floatStyle = useFloat({ amplitude: 5, durationMs: 7000, delayMs: 200 });
  const { cursorStyle } = useTypewriterCursor(isStreaming);

  return (
    <Animated.View entering={revealTextEnter} style={styles.wrap}>
      <Animated.View style={floatStyle}>
        <GlassCard animated={false} padding="lg" intensity={52} style={styles.glowCard}>
          {/* Card Header Info */}
          <View style={styles.cardHeader}>
            <Text style={styles.headerLabel}>DAILY REFLECTION</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Mood: {mood || "Calm"}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Tone: {tone || "Gentle"}</Text>
              </View>
            </View>
          </View>

          {/* Quotation Marks Accent */}
          <Text style={styles.quoteMark}>“</Text>

          {/* Affirmation Text */}
          <Text variant="affirmation" color="primary" align="center" style={styles.affirmation}>
            {text}
            {isStreaming ? (
              <Animated.Text style={[styles.cursor, cursorStyle]}>|</Animated.Text>
            ) : null}
          </Text>

          <Text style={styles.quoteMarkRight}>”</Text>

          {/* Footnote */}
          <Text style={styles.footerLabel}>
            Generated for your {getTimeOfDay()} ritual.
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
  glowCard: {
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(255, 255, 255, 0.4)",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  badgeText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  quoteMark: {
    fontFamily: fontFamily.display,
    fontSize: 48,
    color: "rgba(56, 189, 248, 0.2)",
    height: 30,
    lineHeight: 48,
    textAlign: "left",
    marginBottom: -10,
  },
  quoteMarkRight: {
    fontFamily: fontFamily.display,
    fontSize: 48,
    color: "rgba(56, 189, 248, 0.2)",
    height: 30,
    lineHeight: 48,
    textAlign: "right",
    marginTop: -10,
  },
  affirmation: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    lineHeight: 38,
    paddingHorizontal: 8,
  },
  cursor: {
    color: colors.luxury.accentSoft,
    fontFamily: fontFamily.display,
    fontSize: 26,
  },
  footerLabel: {
    marginTop: 20,
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 0.5,
  },
  reflection: {
    marginTop: 12,
    fontStyle: "italic",
    opacity: 0.85,
  },
});
