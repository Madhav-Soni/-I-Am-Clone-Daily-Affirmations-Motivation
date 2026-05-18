import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Pressable, 
  ActivityIndicator, 
  Alert,
  Platform,
  Switch
} from "react-native";
import { router } from "expo-router";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { GlassCard } from "@/shared/components/primitives/GlassCard";
import { Button, PrimaryButton } from "@/shared/components/primitives/Button";
import { Text } from "@/shared/components/primitives/Text";
import { useAuthStore } from "@/store";
import { authApi } from "@/services/api/modules/auth";
import { routes } from "@/constants/routes";
import { colors } from "@/theme/tokens";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

const AVAILABLE_VOICES = [
  { id: "gentle" as const, name: "Gentle", desc: "Soothing & protective" },
  { id: "motivational" as const, name: "Motivational", desc: "Empowering & driven" },
  { id: "spiritual" as const, name: "Spiritual", desc: "Deep & connection-oriented" },
  { id: "direct" as const, name: "Direct", desc: "Clear, simple & raw" },
];

const AVAILABLE_TOPICS = [
  "Career", "Health", "Confidence", "Relationships", "Mindfulness", "Gratitude", "Productivity"
];

const AVAILABLE_THEMES = [
  { id: "void", name: "Void", colors: ["#000000", "#111111"] },
  { id: "aurora", name: "Aurora", colors: ["#002B24", "#031512"] },
  { id: "dusk", name: "Dusk", colors: ["#1F1625", "#0F0B12"] },
  { id: "minimal", name: "Minimal", colors: ["#1C1917", "#0C0A09"] },
];

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields initialized from authenticated store user profile
  const [selectedVoice, setSelectedVoice] = useState(user?.preferences?.affirmationVoice || "gentle");
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    user?.preferences?.topics || (user?.preferences as any)?.focusTopics || []
  );
  const [dailyFrequency, setDailyFrequency] = useState(user?.preferences?.dailyFrequency || 1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [activeTheme, setActiveTheme] = useState("void");

  // Keep state synced if user changes dynamically
  useEffect(() => {
    if (user) {
      if (user.preferences?.affirmationVoice) setSelectedVoice(user.preferences.affirmationVoice);
      if (user.preferences?.topics) setSelectedTopics(user.preferences.topics);
      if (user.preferences?.dailyFrequency) setDailyFrequency(user.preferences.dailyFrequency);
    }
  }, [user]);

  const handleTopicToggle = (topic: string) => {
    void hapticLight();
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSave = async () => {
    void hapticLight();
    setSaving(true);
    setSuccessMessage(null);
    try {
      const preferences = {
        affirmationVoice: selectedVoice as any,
        topics: selectedTopics.length > 0 ? selectedTopics : ["Mindfulness"],
        focusTopics: selectedTopics.length > 0 ? selectedTopics : ["Mindfulness"], // Compatibility fallback
        dailyFrequency: dailyFrequency,
        ritualReminderTime: reminderTime,
      };

      const response = await authApi.completeOnboarding(preferences);
      if (response?.data?.user) {
        setUser(response.data.user);
        void hapticSuccess();
        setSuccessMessage("Preferences saved successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        Alert.alert("Error", "Invalid response from server.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "Would you like to reset your personalized settings and restart the onboarding sequence?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            void hapticLight();
            try {
              // Mark user onboarded state to false in backend and store
              const response = await authApi.completeOnboarding({
                affirmationVoice: "gentle",
                focusTopics: ["Mindfulness"],
                ritualReminderTime: "08:00",
              });
              if (response?.data?.user) {
                // Revert store state
                setUser({ ...response.data.user, onboarded: false });
                setOnboarded(false);
                router.replace(routes.onboarding.intro);
              }
            } catch (err: any) {
              Alert.alert("Error", "Failed to reset onboarding.");
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            void hapticLight();
            await logout();
            router.replace(routes.auth.welcome);
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently purge your local session, delete your ritual history, and close your account. This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Permanently Delete",
          style: "destructive",
          onPress: async () => {
            void hapticSuccess();
            try {
              await authApi.deleteAccount();
            } catch (err) {
              // Silently fail and continue logging out the user if the server is offline
            }
            await logout();
            router.replace(routes.auth.welcome);
          }
        }
      ]
    );
  };

  const handleUpgrade = () => {
    void hapticLight();
    router.push(routes.modals.paywall);
  };

  const isPremium = user?.tier === "premium";

  return (
    <FullscreenScreen gradient="void" padded={false}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Identity Card */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContainer}>
          <View style={styles.avatarGradient}>
            <Text style={styles.avatarLetter}>
              {(user?.name || "R").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="displayLg" style={styles.userName}>
            {user?.name || "Ritual Practitioner"}
          </Text>
          <Text variant="body" color="muted" style={styles.userEmail}>
            {user?.email || "seeker@mindfulness.org"}
          </Text>
          
          <Pressable 
            onPress={isPremium ? undefined : handleUpgrade}
            style={[styles.tierBadge, isPremium ? styles.premiumBadge : styles.freeBadge]}
          >
            <Text style={[styles.tierBadgeText, isPremium && styles.premiumBadgeText]}>
              {isPremium ? "✦ PREMIUM SUBSCRIBER" : "✦ UPGRADE TO PREMIUM"}
            </Text>
          </Pressable>
        </Animated.View>

        {successMessage && (
          <Animated.View entering={FadeInUp} style={styles.toast}>
            <Text style={styles.toastText}>✓ {successMessage}</Text>
          </Animated.View>
        )}

        {/* Section 1: Affirmation Configuration */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Affirmation Configuration</Text>
          
          <GlassCard padding="lg" animated={false}>
            <Text style={styles.label}>AFFIRMATION TONE</Text>
            <View style={styles.voiceGrid}>
              {AVAILABLE_VOICES.map((voice) => {
                const active = selectedVoice === voice.id;
                return (
                  <Pressable
                    key={voice.id}
                    onPress={() => {
                      void hapticLight();
                      setSelectedVoice(voice.id);
                    }}
                    style={[styles.voiceItem, active && styles.voiceItemActive]}
                  >
                    <Text style={[styles.voiceName, active && styles.voiceNameActive]}>
                      {voice.name}
                    </Text>
                    <Text style={styles.voiceDesc}>{voice.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 24 }]}>FOCUS AREAS</Text>
            <View style={styles.topicsGrid}>
              {AVAILABLE_TOPICS.map((topic) => {
                const active = selectedTopics.includes(topic);
                return (
                  <Pressable
                    key={topic}
                    onPress={() => handleTopicToggle(topic)}
                    style={[styles.topicChip, active && styles.topicChipActive]}
                  >
                    <Text style={[styles.topicChipText, active && styles.topicChipTextActive]}>
                      {topic}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 24 }]}>DAILY RITUAL FREQUENCY</Text>
            <View style={styles.stepperContainer}>
              <Pressable
                onPress={() => {
                  void hapticLight();
                  setDailyFrequency(Math.max(1, dailyFrequency - 1));
                }}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>
                {dailyFrequency} {dailyFrequency === 1 ? "affirmation / day" : "affirmations / day"}
              </Text>
              <Pressable
                onPress={() => {
                  void hapticLight();
                  setDailyFrequency(Math.min(5, dailyFrequency + 1));
                }}
                style={styles.stepperBtn}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Section 2: App Preferences */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          
          <GlassCard padding="lg" animated={false}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Daily Ritual Reminder</Text>
                <Text style={styles.settingSub}>Receive push prompts to check in</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  void hapticLight();
                  setNotificationsEnabled(val);
                }}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.brand[500] }}
                thumbColor="#ffffff"
              />
            </View>

            {notificationsEnabled && (
              <View style={styles.subSettingContainer}>
                <Text style={styles.label}>REMINDER TIME</Text>
                <View style={styles.timeInputWrapper}>
                  {["07:00", "08:00", "09:00", "12:00", "20:00"].map((time) => {
                    const active = reminderTime === time;
                    return (
                      <Pressable
                        key={time}
                        onPress={() => {
                          void hapticLight();
                          setReminderTime(time);
                        }}
                        style={[styles.timeOption, active && styles.timeOptionActive]}
                      >
                        <Text style={[styles.timeOptionText, active && styles.timeOptionTextActive]}>
                          {time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 24 }]}>CINEMATIC CARD THEME</Text>
            <View style={styles.themeRow}>
              {AVAILABLE_THEMES.map((theme) => {
                const active = activeTheme === theme.id;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => {
                      void hapticLight();
                      setActiveTheme(theme.id);
                    }}
                    style={[styles.themePill, active && styles.themePillActive]}
                  >
                    <View 
                      style={[styles.themeColorDot, { backgroundColor: theme.colors[0] }]} 
                    />
                    <Text style={[styles.themePillText, active && styles.themePillTextActive]}>
                      {theme.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Section 3: Account Lifecycle */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Account Control</Text>
          
          <GlassCard padding="lg" animated={false}>
            <Pressable onPress={handleResetOnboarding} style={styles.actionItem}>
              <Text style={styles.actionItemText}>Reset Onboarding Wizard</Text>
              <Text style={styles.actionItemSub}>Redo selections from a clean state</Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable onPress={handleLogout} style={styles.actionItem}>
              <Text style={styles.actionItemText}>Sign Out of Sanctuary</Text>
              <Text style={styles.actionItemSub}>Safely end your local session</Text>
            </Pressable>

            <View style={styles.divider} />

            <Pressable onPress={handleDeleteAccount} style={styles.actionItem}>
              <Text style={[styles.actionItemText, { color: "#ef4444" }]}>Delete Account</Text>
              <Text style={styles.actionItemSub}>Permanently purge files and profile data</Text>
            </Pressable>
          </GlassCard>
        </Animated.View>

        {/* Save Settings CTA */}
        <View style={styles.saveContainer}>
          <PrimaryButton
            onPress={handleSave}
            disabled={saving}
            size="lg"
            fullWidth
          >
            {saving ? <ActivityIndicator color="#ffffff" /> : "Save Changes"}
          </PrimaryButton>
        </View>
      </ScrollView>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 56 : 32,
    marginBottom: 24,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand[500] || "#0D9488",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarLetter: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "DM-Sans",
  },
  userName: {
    fontSize: 26,
    fontFamily: "Cormorant_700Bold",
    color: "#ffffff",
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 16,
    textAlign: "center",
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  freeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  premiumBadge: {
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  tierBadgeText: {
    fontSize: 10,
    fontFamily: "DM-Sans",
    fontWeight: "600",
    letterSpacing: 2,
    color: "rgba(255, 255, 255, 0.6)",
  },
  premiumBadgeText: {
    color: "#fbbf24",
  },
  toast: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  toastText: {
    color: "#34d399",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.3)",
    fontWeight: "700",
    marginBottom: 10,
    paddingLeft: 4,
    fontFamily: "DM-Sans",
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "DM-Sans",
  },
  voiceGrid: {
    gap: 8,
  },
  voiceItem: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  voiceItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  voiceName: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 2,
    fontFamily: "DM-Sans",
  },
  voiceNameActive: {
    color: "#ffffff",
  },
  voiceDesc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.3)",
    fontFamily: "DM-Sans",
  },
  topicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  topicChipActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  topicChipText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
    fontFamily: "DM-Sans",
  },
  topicChipTextActive: {
    color: "#ffffff",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepperBtnText: {
    fontSize: 20,
    color: "#ffffff",
    fontWeight: "300",
  },
  stepperValue: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabel: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    fontFamily: "DM-Sans",
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.35)",
    fontFamily: "DM-Sans",
  },
  subSettingContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  timeInputWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  timeOptionActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  timeOptionText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  timeOptionTextActive: {
    color: "#ffffff",
  },
  themeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  themePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
  },
  themePillActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  themeColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  themePillText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
    fontFamily: "DM-Sans",
  },
  themePillTextActive: {
    color: "#ffffff",
  },
  actionItem: {
    paddingVertical: 12,
  },
  actionItemText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    fontFamily: "DM-Sans",
    marginBottom: 2,
  },
  actionItemSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.35)",
    fontFamily: "DM-Sans",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 4,
  },
  saveContainer: {
    marginTop: 8,
    marginBottom: 48,
  },
});
