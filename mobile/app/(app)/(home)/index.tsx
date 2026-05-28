import React, { useMemo, useState } from "react";
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  Pressable,
  Platform,
  Dimensions
} from "react-native";
import { router } from "expo-router";
import Animated, { 
  FadeInUp, 
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from "react-native-reanimated";
import { spring } from "@/theme/motion";
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

function AnimatedActionCard({
  emoji,
  title,
  subtitle,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, spring.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.actionCardWrapper}
    >
      <Animated.View style={[styles.actionCard, animatedStyle]}>
        <View style={{ height: 28, justifyContent: "center", marginBottom: 2 }}>
          <Text style={styles.actionEmoji}>{emoji}</Text>
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: sessionData, isLoading, refetch, isOffline } = useTodaySession();
  const [ritualLoading, setRitualLoading] = useState(false);

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
    setRitualLoading(true);
    setTimeout(() => {
      setRitualLoading(false);
      router.push(routes.app.checkIn);
    }, 700);
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
        style={{ flex: 1, zIndex: 10 }}
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
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: 14,
            marginTop: 24,
            marginBottom: 24,
          }}
        >
          {[
            { label: "DAY STREAK",    value: "14",  icon: "🔥" },
            { label: "TOTAL RITUALS", value: "126", icon: "✨" },
            { label: "CONSISTENCY",   value: "91%", icon: "📈" },
            { label: "AFFIRMATIONS",  value: "142", icon: "🌿" },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                width: "47%",
                height: 155,
                borderRadius: 28,
                paddingHorizontal: 18,
                paddingTop: 18,
                paddingBottom: 18,
                justifyContent: "space-between",
                alignItems: "flex-start",
                backgroundColor: "rgba(12, 14, 28, 0.85)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.10)",
                // Premium subtle glow/shadow setup
                shadowColor: "#38bdf8",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
                elevation: 5,
                overflow: "visible",
              }}
            >
              {/* Icon — breathing room from top edge + fixed baseline wrapper */}
              <View style={{ height: 36, justifyContent: "center" }}>
                <Text style={{
                  fontSize: 28,
                  lineHeight: 34,
                }}>
                  {item.icon}
                </Text>
              </View>

              {/* Number + Label — anchored to bottom */}
              <View style={{ width: "100%", paddingLeft: 2 }}>
                <Text style={{
                  fontSize: 34,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  fontFamily: "DMSans_700Bold",
                  letterSpacing: 0.5,
                  lineHeight: 40,
                }}>
                  {item.value}
                </Text>
                <Text style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontFamily: "DMSans_500Medium",
                  marginTop: 6,
                  includeFontPadding: false,
                }}>
                  {item.label}
                </Text>
              </View>
            </View>
          ))}
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
                A personalized affirmation is ready for your current emotional state.
              </Text>
              <PrimaryButton
                onPress={handleBeginRitual}
                size="md"
                style={styles.emptyBtn}
                loading={ritualLoading}
                loadingText="Preparing..."
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
            <AnimatedActionCard
              emoji="📝"
              title="New Check-In"
              subtitle="Log your current state"
              onPress={() => {
                void hapticLight();
                router.push(routes.app.checkIn);
              }}
            />

            <AnimatedActionCard
              emoji="📚"
              title="Intention Library"
              subtitle="View previous cards"
              onPress={() => {
                void hapticLight();
                router.push(routes.app.library);
              }}
            />

            <AnimatedActionCard
              emoji="⚙️"
              title="Adjust Settings"
              subtitle="Tune AI parameters"
              onPress={() => {
                void hapticLight();
                router.push(routes.app.profile);
              }}
            />
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

const { width: screenWidth } = Dimensions.get("window");
const greetingScale = screenWidth < 380 ? 0.85 : 1.0;

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
    fontSize: Math.round((Platform.OS === "android" ? 28 : 32) * greetingScale),
    fontFamily: "Cormorant_700Bold",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: Math.round((Platform.OS === "android" ? 34 : 40) * greetingScale),
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "47%",
    height: 150,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  statTextContainer: {
    width: "100%",
  },
  statEmoji: {
    fontSize: 34,
  },
  statValue: {
    fontSize: 34,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "DM-Sans",
    marginTop: 12,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    fontFamily: "DM-Sans",
    fontWeight: "700",
    letterSpacing: 2,
    opacity: 0.7,
    marginTop: 8,
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
    marginBottom: 8,
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
  actionCardWrapper: {
    flex: 1,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(12, 14, 28, 0.65)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 16,
    alignItems: "flex-start",
    minHeight: 132,
    justifyContent: "space-between",
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "DMSans_700Bold",
  },
  actionSub: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.45)",
    fontFamily: "DMSans_500Medium",
    lineHeight: 13,
    marginTop: 4,
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
