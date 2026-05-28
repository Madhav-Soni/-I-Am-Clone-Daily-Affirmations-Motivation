import React, { useEffect, useState } from "react";
import { StyleSheet, View, Share, Platform } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing
} from "react-native-reanimated";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { GlassCard } from "@/shared/components/primitives/GlassCard";
import { PrimaryButton, SecondaryButton, GhostButton } from "@/shared/components/primitives/Button";
import { Text } from "@/shared/components/primitives/Text";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import { apiClient, API_BASE_URL } from "@/services/api/client";
import { colors } from "@/theme/tokens";
import { fontFamily } from "@/theme/typography";
import { useQueryClient } from "@tanstack/react-query";

export default function RitualScreen() {
  const { mood = "hopeful", tone = "spiritual" } = useLocalSearchParams<{ mood?: string; tone?: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [affirmationText, setAffirmationText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [loadingText, setLoadingText] = useState("Analyzing your emotional state...");
  const queryClient = useQueryClient();

  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const fetchAffirmation = async () => {
    setLoading(true);
    setSaved(false);
    setLoadingText("Analyzing your emotional state...");
    
    const textTimer = setTimeout(() => {
      setLoadingText("Crafting your personalized affirmation...");
    }, 1800);

    try {
      const targetUrl = API_BASE_URL.replace("/api/v1", "") + "/api/affirmations/generate";
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, tone }),
      });
      const data = await response.json();
      if (data.success) {
        setAffirmationText(data.affirmation);
      } else {
        setAffirmationText("You are growing gently into the person you are meant to become.");
      }
    } catch (error) {
      console.error("Failed to generate affirmation:", error);
      setAffirmationText("You are growing gently into the person you are meant to become.");
    } finally {
      clearTimeout(textTimer);
      // Keep loading for at least 3.2s to make the multi-stage load feel premium and fully readable
      setTimeout(() => {
        setLoading(false);
      }, 3200);
    }
  };

  useEffect(() => {
    fetchAffirmation();
  }, [mood, tone]);

  // Typewriter effect logic
  useEffect(() => {
    if (!loading && affirmationText) {
      let currentText = "";
      let index = 0;
      setDisplayedText("");
      
      const interval = setInterval(() => {
        if (index < affirmationText.length) {
          currentText += affirmationText[index];
          setDisplayedText(currentText);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 35); // base organic typewriter reveal speed
      
      return () => clearInterval(interval);
    }
  }, [loading, affirmationText]);

  const handleSave = async () => {
    void hapticSuccess();
    setSaving(true);
    try {
      // Save directly to the backend database
      await apiClient.post("/affirmations/save", {
        content: affirmationText,
        mood,
        tone,
      });
      // Invalidate queries so it shows up in Library tab
      await queryClient.invalidateQueries({ queryKey: ["affirmations"] });
      setSaved(true);
    } catch (error) {
      console.error("Failed to save affirmation:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    void hapticLight();
    try {
      await Share.share({
        message: `Daily Intention:\n"${affirmationText}"\n\nGenerated with I AM WELL.`,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const handleDone = () => {
    void hapticLight();
    router.replace("/(app)/(home)");
  };

  if (loading) {
    return (
      <FullscreenScreen gradient="aurora" contentClassName="justify-center items-center px-8">
        <Animated.View style={[{ alignItems: "center", gap: 24 }, pulseStyle]}>
          <Text style={{ fontSize: 36, color: "#a78bfa" }}>✦</Text>
          <Text variant="headline" align="center" style={{ color: "#ffffff", letterSpacing: 0.5, lineHeight: 28, fontFamily: "DM-Sans" }}>
            {loadingText}
          </Text>
        </Animated.View>
      </FullscreenScreen>
    );
  }

  return (
    <FullscreenScreen gradient="aurora" padded={true} contentClassName="justify-center">
      <View style={styles.container}>
        {/* Cinematic Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Text style={styles.headerLabel}>DAILY REFLECTION</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Mood: {mood.toUpperCase()}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Tone: {tone.toUpperCase()}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Ambient Glow & Affirmation Card */}
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.cardContainer}>
          <GlassCard animated={false} padding="lg" intensity={52} style={styles.glowCard}>
            <Text style={styles.quoteMark}>“</Text>
            <Text variant="affirmation" color="primary" align="center" style={styles.affirmation}>
              {displayedText}
            </Text>
            <Text style={styles.quoteMarkRight}>”</Text>
            <Text style={styles.footerLabel}>Generated for your evening ritual.</Text>
          </GlassCard>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.actions}>
          <View style={styles.row}>
            <View style={styles.half}>
              <SecondaryButton fullWidth onPress={handleShare}>
                📤 Share Card
              </SecondaryButton>
            </View>
            <View style={styles.half}>
              <PrimaryButton
                fullWidth
                onPress={handleSave}
                disabled={saved}
                loading={saving}
                loadingText="Saving..."
              >
                {saved ? "✓ Saved" : "💾 Save Intention"}
              </PrimaryButton>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <SecondaryButton fullWidth onPress={fetchAffirmation}>
                🔄 Regenerate
              </SecondaryButton>
            </View>
            <View style={styles.half}>
              <GhostButton fullWidth onPress={handleDone}>
                Close in Stillness
              </GhostButton>
            </View>
          </View>
        </Animated.View>
      </View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontFamily: "DM-Sans",
    letterSpacing: 1,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: "DM-Sans",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  badgeText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
    letterSpacing: 1,
    fontFamily: "DM-Sans",
  },
  cardContainer: {
    width: "100%",
  },
  glowCard: {
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 12,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.25)",
  },
  quoteMark: {
    fontFamily: fontFamily.display,
    fontSize: 64,
    color: "rgba(56, 189, 248, 0.15)",
    height: 40,
    lineHeight: 64,
    textAlign: "left",
    marginBottom: -10,
  },
  quoteMarkRight: {
    fontFamily: fontFamily.display,
    fontSize: 64,
    color: "rgba(56, 189, 248, 0.15)",
    height: 40,
    lineHeight: 64,
    textAlign: "right",
    marginTop: -10,
  },
  affirmation: {
    fontSize: 24,
    lineHeight: 36,
    fontFamily: "Cormorant_700Bold",
    paddingHorizontal: 16,
  },
  footerLabel: {
    marginTop: 24,
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 0.5,
    fontFamily: "DM-Sans",
  },
  actions: {
    gap: 14,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 14,
  },
  half: {
    flex: 1,
  },
});
