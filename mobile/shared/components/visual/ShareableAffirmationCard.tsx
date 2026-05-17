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
  width?: number;
  height?: number;
};

const THEME_GRADIENTS: Record<ShareTheme, GradientDefinition | null> = {
  aurora: gradientPresets.aurora,
  ember: gradientPresets.ember,
  ocean: gradientPresets.ocean,
  void: gradientPresets.void,
  minimal: null, // White/Black minimal
};

export const ShareableAffirmationCard = React.forwardRef<View, ShareableAffirmationCardProps>(
  ({ content, mood, category, note, timestamp, theme = "void", width: customWidth, height: customHeight }, ref) => {
    const cardWidth = customWidth || CARD_WIDTH;
    const cardHeight = customHeight || CARD_HEIGHT;
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

    // Adaptive Typography: Scale font size based on content length and card width
    const fontSize = useMemo(() => {
      const length = content.length;
      let baseSize = 48;
      if (length < 60) baseSize = 48;
      else if (length < 120) baseSize = 40;
      else if (length < 200) baseSize = 32;
      else baseSize = 26;

      // Scale factor dynamically proportional to 390 (average viewport width)
      const scaleFactor = cardWidth / 390;
      return Math.max(16, Math.round(baseSize * scaleFactor));
    }, [content, cardWidth]);

    const noteFontSize = Math.max(11, Math.round(18 * (cardWidth / 390)));
    const brandingFontSize = Math.max(8, Math.round(10 * (cardWidth / 390)));
    const moodFontSize = Math.max(8, Math.round(10 * (cardWidth / 390)));
    const dateFontSize = Math.max(8, Math.round(10 * (cardWidth / 390)));

    return (
      <View 
        ref={ref} 
        style={[styles.container, { width: cardWidth, height: cardHeight }]} 
        collapsable={false}
      >
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

        <View 
          style={[
            styles.content, 
            { 
              paddingHorizontal: cardWidth * 0.12, 
              paddingTop: cardHeight * 0.12, 
              paddingBottom: cardHeight * 0.12 
            }
          ]}
        >
          <View style={styles.header}>
            <Text 
              style={[
                styles.branding, 
                { fontSize: brandingFontSize, letterSpacing: brandingFontSize * 0.5 },
                isMinimal && { color: "#000", opacity: 0.4 }
              ]}
            >
              I AM WELL • {category || "GENERAL"}
            </Text>
          </View>

          <View style={styles.body}>
            <Text
              style={[
                styles.affirmationText, 
                { fontSize, lineHeight: fontSize * 1.25 },
                isMinimal ? { color: "#1a1a1a" } : { color: "rgba(255,255,255,0.95)" }
              ]}
              className="text-center"
            >
              "{content}"
            </Text>
            
            {note && (
              <View style={[styles.noteContainer, { marginTop: cardHeight * 0.05 }]}>
                <View 
                  style={[
                    styles.noteLine, 
                    { width: cardWidth * 0.15, marginBottom: cardHeight * 0.03 },
                    isMinimal && { backgroundColor: "rgba(0,0,0,0.1)" }
                  ]} 
                />
                <Text 
                  style={[
                    styles.noteText, 
                    { fontSize: noteFontSize, lineHeight: noteFontSize * 1.5 },
                    isMinimal && { color: "rgba(0,0,0,0.5)" }
                  ]}
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
                  { 
                    paddingHorizontal: cardWidth * 0.05, 
                    paddingVertical: cardHeight * 0.015,
                    marginBottom: cardHeight * 0.03 
                  },
                  isMinimal ? { borderColor: "rgba(0,0,0,0.1)", backgroundColor: "rgba(0,0,0,0.03)" } : {}
                ]}
                className="rounded-full border border-white/10 bg-white/5 self-center"
              >
                <Text 
                  style={[
                    styles.moodText, 
                    { fontSize: moodFontSize, letterSpacing: moodFontSize * 0.4 },
                    isMinimal && { color: "rgba(0,0,0,0.5)" }
                  ]}
                >
                  FELT {mood}
                </Text>
              </View>
            )}
            <Text 
              style={[
                styles.dateText, 
                { fontSize: dateFontSize, letterSpacing: dateFontSize * 0.3 },
                isMinimal && { color: "rgba(0,0,0,0.3)" }
              ]}
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
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  branding: {
    fontFamily: "DM-Sans",
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
  },
  noteContainer: {
    alignItems: "center",
  },
  noteLine: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  noteText: {
    color: "rgba(255,255,255,0.5)",
  },
  footer: {
    alignItems: "center",
  },
  moodBadge: {},
  moodText: {
    fontFamily: "DM-Sans",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  dateText: {
    fontFamily: "DM-Sans",
    textTransform: "uppercase",
    textAlign: "center",
  },
});
