import React, { useMemo } from "react";
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  Pressable,
  Platform
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { routes } from "@/constants/routes";
import { colors } from "@/theme/tokens";
import { useAuthStore } from "@/store";
import { useTodaySession } from "@/features/profile/hooks/useTodaySession";
import { hapticLight } from "@/shared/lib/haptics";
import { 
  FullscreenScreen, 
  GlassCard, 
  PrimaryButton, 
  Text 
} from "@/shared/components/primitives";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: sessionData, isLoading, refetch, isOffline } = useTodaySession();

  const formattedTimeOfDay = useMemo(() => {
    if (!sessionData?.timeOfDayTone) return "Good day";
    const tone = sessionData.timeOfDayTone;
    return `Good ${tone.charAt(0).toUpperCase() + tone.slice(1)}`;
  }, [sessionData?.timeOfDayTone]);

  const greeting = useMemo(() => {
    const firstName = user?.name ? user.name.split(" ")[0] : "Seeker";
    return `${formattedTimeOfDay}, ${firstName}`;
  }, [formattedTimeOfDay, user?.name]);

  if (isLoading) {
    return (
      <FullscreenScreen gradient="aurora" contentClassName="justify-center items-center py-8">
        <ActivityIndicator size="large" color="#ffffff" style={{ opacity: 0.6 }} />
      </FullscreenScreen>
    );
  }

  const latestAffirmation = sessionData?.latestAffirmation;
  const continuityMsg = sessionData?.emotionalContinuityMessage || "Welcome to your personal space.";
  const showRecovery = sessionData?.compassionRecoveryState;
  const isPremium = user?.tier === "premium";

  const handleBeginRitual = () => {
    void hapticLight();
    // Direct user to check-in flow
    router.push(routes.app.checkIn);
  };

  const handleShareAffirmation = () => {
    if (!latestAffirmation) return;
    void hapticLight();
    router.push({
      pathname: "/(modals)/share-affirmation",
      params: {
        content: latestAffirmation.content,
        category: latestAffirmation.category || "General",
        mood: latestAffirmation.aiMetadata?.moodContext || sessionData?.recentMood?.mood || "Calm",
        note: sessionData?.recentMood?.note || "",
        timestamp: latestAffirmation.createdAt,
      }
    });
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <FullscreenScreen gradient="aurora" padded={false}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic Personal Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerText}>
                🌿 Connected to Inner Calm: Sanctuary offline mode active.
              </Text>
            </View>
          )}
          <View style={styles.headerTopRow}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            {isPremium && <Text style={styles.premiumBadge}>✦ PREMIUM</Text>}
          </View>
          <Text variant="displayLg" style={styles.greetingTitle}>
            {greeting}
          </Text>
          <Text variant="body" color="secondary" style={styles.continuityText}>
            {continuityMsg}
          </Text>
          {sessionData?.reflectionCallback && (
            <Text style={styles.reflectionCallbackText}>
              💡 {sessionData.reflectionCallback}
            </Text>
          )}

          {/* Active Voice Tone Indicator */}
          <View style={styles.voiceBadge}>
            <Text style={styles.voiceBadgeText}>
              ✦ {user?.preferences?.affirmationVoice ? user.preferences.affirmationVoice.toUpperCase() : "GENTLE"} CADENCE ACTIVE
            </Text>
          </View>
        </Animated.View>

        {/* Personalized Progress Panel */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.statsContainer}>
          <GlassCard padding="md" animated={false} style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <View>
              <Text style={styles.statValue}>{sessionData?.streakState || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </GlassCard>

          <GlassCard padding="md" animated={false} style={styles.statCard}>
            <Text style={styles.statEmoji}>✨</Text>
            <View>
              <Text style={styles.statValue}>{sessionData?.lifetimeRituals || 0}</Text>
              <Text style={styles.statLabel}>Total Rituals</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {showRecovery && (
          <Animated.View entering={FadeInUp} style={styles.recoveryContainer}>
            <GlassCard padding="md" animated={false} style={styles.recoveryCard}>
              <Text style={styles.recoveryText}>🛡️ Compassion Shield Active: Streak preserved during stabilization.</Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Today's Affirmation Surfacing */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Generative Ritual</Text>
          
          {latestAffirmation ? (
            <GlassCard padding="lg" animated={false} style={styles.affirmationCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardCategory}>{latestAffirmation.category?.toUpperCase() || "GENERAL"}</Text>
                {latestAffirmation.aiMetadata?.moodContext && (
                  <View style={styles.alignedMoodBadge}>
                    <Text style={styles.alignedMoodText}>ALIGNED TO {latestAffirmation.aiMetadata.moodContext.toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.quote}>
                "{latestAffirmation.content}"
              </Text>
              
              <View style={styles.cardActions}>
                <Pressable onPress={handleShareAffirmation} style={styles.shareBtn}>
                  <Text style={styles.shareBtnText}>📤 Share & Export Card</Text>
                </Pressable>
              </View>
            </GlassCard>
          ) : (
            <GlassCard padding="lg" animated={false} style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Your intention is waiting to be materialized. Take a deep breath and begin your daily sequence.
              </Text>
              <PrimaryButton
                onPress={handleBeginRitual}
                size="md"
                style={styles.emptyBtn}
              >
                Begin Daily Ritual
              </PrimaryButton>
            </GlassCard>
          )}
        </Animated.View>

        {/* Recent Mood Insight Panel */}
        {sessionData?.recentMood && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Introspective State</Text>
            <GlassCard padding="lg" animated={false} style={styles.moodCard}>
              <View style={styles.moodHeader}>
                <View style={styles.moodTitleRow}>
                  <Text style={styles.moodIndicator}>🧠 Felt {sessionData.recentMood.mood}</Text>
                  <Text style={styles.intensityLabel}>Intensity {sessionData.recentMood.intensity}/5</Text>
                </View>
                <Text style={styles.moodTime}>
                  Logged {new Date(sessionData.recentMood.createdAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              {sessionData.recentMood.note ? (
                <Text style={styles.moodNote}>
                  "{sessionData.recentMood.note}"
                </Text>
              ) : (
                <Text style={styles.moodNoteEmpty}>No written reflection recorded for this check-in.</Text>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Quick Actions Panel */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Sanctuary Quick Paths</Text>
          <View style={styles.actionsGrid}>
            <Pressable 
              onPress={() => {
                void hapticLight();
                router.push(routes.app.checkIn);
              }}
              style={styles.actionCard}
            >
              <Text style={styles.actionEmoji}>📝</Text>
              <Text style={styles.actionTitle}>New Check-In</Text>
              <Text style={styles.actionSub}>Log your current state</Text>
            </Pressable>

            <Pressable 
              onPress={() => {
                void hapticLight();
                router.push(routes.app.library);
              }}
              style={styles.actionCard}
            >
              <Text style={styles.actionEmoji}>📚</Text>
              <Text style={styles.actionTitle}>Intention Library</Text>
              <Text style={styles.actionSub}>View previous cards</Text>
            </Pressable>

            <Pressable 
              onPress={() => {
                void hapticLight();
                router.push(routes.app.profile);
              }}
              style={styles.actionCard}
            >
              <Text style={styles.actionEmoji}>⚙️</Text>
              <Text style={styles.actionTitle}>Adjust Settings</Text>
              <Text style={styles.actionSub}>Tune AI parameters</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Revisit / Revitalize Primary Call to Action */}
        {latestAffirmation && (
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.revisitContainer}>
            <PrimaryButton
              fullWidth
              size="lg"
              onPress={() => {
                void hapticLight();
                router.push({
                  pathname: routes.modals.affirmationReveal,
                  params: { category: sessionData?.suggestedEmotionalDirection || "General" },
                });
              }}
            >
              Revisit Today's Ritual
            </PrimaryButton>
          </Animated.View>
        )}
      </ScrollView>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: Platform.OS === "android" ? 56 : 32,
    marginBottom: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  premiumBadge: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "#fbbf24",
    fontWeight: "700",
    fontFamily: "DM-Sans",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  greetingTitle: {
    fontSize: 32,
    fontFamily: "Cormorant_700Bold",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: 40,
  },
  continuityText: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "DM-Sans",
  },
  reflectionCallbackText: {
    fontSize: 13,
    fontStyle: "italic",
    color: colors.luxury.teal || "#2DD4BF",
    marginTop: 8,
    lineHeight: 18,
    fontFamily: "DM-Sans",
  },
  voiceBadge: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  voiceBadgeText: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "DM-Sans",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: "DM-Sans",
  },
  recoveryContainer: {
    marginBottom: 24,
  },
  recoveryCard: {
    borderColor: "rgba(45, 212, 191, 0.3)",
    backgroundColor: "rgba(45, 212, 191, 0.05)",
  },
  recoveryText: {
    fontSize: 12,
    color: "#2dd4bf",
    fontWeight: "500",
    fontFamily: "DM-Sans",
    textAlign: "center",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.3)",
    fontWeight: "700",
    marginBottom: 12,
    paddingLeft: 2,
    fontFamily: "DM-Sans",
  },
  affirmationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardCategory: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
    color: colors.brand[400] || "#38BDF8",
    fontFamily: "DM-Sans",
  },
  alignedMoodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  alignedMoodText: {
    fontSize: 8,
    letterSpacing: 1,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  quote: {
    fontSize: 18,
    fontFamily: "Cormorant_700Bold",
    fontStyle: "italic",
    lineHeight: 26,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  cardActions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 12,
    alignItems: "center",
  },
  shareBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  shareBtnText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    fontFamily: "DM-Sans",
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  emptyBtn: {
    minWidth: 180,
  },
  moodCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  moodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  moodTitleRow: {
    gap: 4,
  },
  moodIndicator: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "DM-Sans",
  },
  intensityLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: "DM-Sans",
  },
  moodTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.3)",
    fontFamily: "DM-Sans",
  },
  moodNote: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    color: "rgba(255, 255, 255, 0.55)",
    fontFamily: "DM-Sans",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    padding: 12,
    borderRadius: 12,
  },
  moodNoteEmpty: {
    fontSize: 12,
    fontStyle: "italic",
    color: "rgba(255, 255, 255, 0.3)",
    fontFamily: "DM-Sans",
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    gap: 8,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "DM-Sans",
  },
  actionSub: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.35)",
    fontFamily: "DM-Sans",
    lineHeight: 12,
  },
  revisitContainer: {
    marginTop: 8,
    marginBottom: 48,
  },
  offlineBanner: {
    backgroundColor: "rgba(45, 212, 191, 0.1)",
    borderColor: "rgba(45, 212, 191, 0.2)",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  offlineBannerText: {
    fontSize: 12,
    color: "#2dd4bf",
    fontWeight: "600",
    fontFamily: "DM-Sans",
    textAlign: "center",
  },
});
