import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/shared/components/primitives/Text";
import { gradientPresets, type GradientDefinition } from "@/theme/gradients";
import { colors } from "@/theme/tokens";
import type { ShareTheme } from "@/features/affirmation/types/sharing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH;
const CARD_HEIGHT = (CARD_WIDTH * 1920) / 1080;

type ShareableAffirmationCardProps = {
  content: string;
  mood?: string;
  category?: string;
  note?: string;
  timestamp?: string;
  theme?: ShareTheme;
};

const THEME_GRADIENTS: Record<ShareTheme, GradientDefinition | null> = {
  aurora: gradientPresets.aurora,
  ember: gradientPresets.ember,
  ocean: gradientPresets.ocean,
  void: gradientPresets.void,
  minimal: null, // White/Black minimal
};

export const ShareableAffirmationCard = React.forwardRef<View, ShareableAffirmationCardProps>(
  ({ content, mood, category, note, timestamp, theme = "void" }, ref) => {
    const gradient = THEME_GRADIENTS[theme];
    const isMinimal = theme === "minimal";

    const dateStr = useMemo(() => {
      const date = timestamp ? new Date(timestamp) : new Date();
      return date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }, [timestamp]);

    // Adaptive Typography: Scale font size based on content length
    const fontSize = useMemo(() => {
      const length = content.length;
      if (length < 60) return 48;
      if (length < 120) return 40;
      if (length < 200) return 32;
      return 28;
    }, [content]);

    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        {gradient ? (
          <LinearGradient
            colors={gradient.colors as unknown as [string, string, ...string[]]}
            start={gradient.start}
            end={gradient.end}
            locations={gradient.locations as unknown as [number, number, ...number[]]}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff" }]} />
        )}

        {!isMinimal && (
          <>
            <View style={[styles.glow, { backgroundColor: colors.luxury.accent, top: "15%", left: "-25%", opacity: 0.2 }]} />
            <View style={[styles.glow, { backgroundColor: colors.brand[500], bottom: "5%", right: "-35%", opacity: 0.15 }]} />
          </>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text 
              style={[styles.branding, isMinimal && { color: "#000", opacity: 0.4 }]}
            >
              I AM WELL • {category || "GENERAL"}
            </Text>
          </View>

          <View style={styles.body}>
            <Text
              style={[
                styles.affirmationText, 
                { fontSize },
                isMinimal ? { color: "#1a1a1a" } : { color: "rgba(255,255,255,0.95)" }
              ]}
              className="text-center"
            >
              "{content}"
            </Text>
            
            {note && (
              <View style={styles.noteContainer}>
                <View style={[styles.noteLine, isMinimal && { backgroundColor: "rgba(0,0,0,0.1)" }]} />
                <Text 
                  style={[styles.noteText, isMinimal && { color: "rgba(0,0,0,0.5)" }]}
                  className="text-center italic px-6"
                >
                  {note}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            {mood && (
              <View 
                style={[
                  styles.moodBadge,
                  isMinimal ? { borderColor: "rgba(0,0,0,0.1)", backgroundColor: "rgba(0,0,0,0.03)" } : {}
                ]}
                className="mb-6 px-5 py-2 rounded-full border border-white/10 bg-white/5 self-center"
              >
                <Text 
                  style={[styles.moodText, isMinimal && { color: "rgba(0,0,0,0.5)" }]}
                >
                  FELT {mood}
                </Text>
              </View>
            )}
            <Text 
              style={[styles.dateText, isMinimal && { color: "rgba(0,0,0,0.3)" }]}
            >
              {dateStr}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  content: {
    flex: 1,
    paddingHorizontal: 48,
    paddingTop: 100,
    paddingBottom: 100,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  branding: {
    fontSize: 10,
    letterSpacing: 5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  affirmationText: {
    fontFamily: "Cormorant_700Bold",
    fontStyle: "italic",
    lineHeight: 60,
  },
  noteContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  noteLine: {
    width: 60,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 24,
  },
  noteText: {
    fontSize: 18,
    lineHeight: 28,
    color: "rgba(255,255,255,0.5)",
  },
  footer: {
    alignItems: "center",
  },
  moodBadge: {},
  moodText: {
    fontSize: 10,
    letterSpacing: 4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  dateText: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
  },
});
