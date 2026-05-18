import React from "react";
import { StyleSheet, ScrollView, View, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import { FullscreenScreen, GlassCard, Text } from "@/shared/components/primitives";
import { hapticLight } from "@/shared/lib/haptics";

export default function PrivacyPolicyScreen() {
  const handleGoBack = () => {
    void hapticLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <FullscreenScreen gradient="void" padded={false}>
      <View style={styles.headerRow}>
        <Pressable onPress={handleGoBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard padding="lg" animated={false} style={styles.card}>
          <Text variant="displayLg" style={styles.title}>
            Sanctuary Privacy & Trust Policy
          </Text>
          <Text variant="body" color="muted" style={styles.date}>
            Effective Date: May 19, 2026
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeading}>🌿 1. Core Commitment to Wellness Privacy</Text>
          <Text style={styles.paragraph}>
            Sanctuary is designed as a secure space for your emotional and mental wellbeing. 
            We believe that your personal thoughts, feelings, and reflections are sacred. 
            We do not sell, rent, or lease your private reflections to any third party.
          </Text>

          <Text style={styles.sectionHeading}>🔐 2. Information We Collect & How We Use It</Text>
          <Text style={styles.paragraph}>
            - **Account Information:** Standard credentials (email, name) used strictly to authenticate and secure your account.
            - **Introspective States & Notes:** Daily check-ins and reflections are processed dynamically to personalize your affirmations.
            - **Sanitation Rules:** All reflections are passed through a client-side regex-based sanitizer before leaving your device to strip explicit personal identifiers (emails, phone numbers, addresses, credit cards, IP addresses).
          </Text>

          <Text style={styles.sectionHeading}>🤖 3. AI Processing Disclosures</Text>
          <Text style={styles.paragraph}>
            We utilize secure Large Language Models (like Llama and GPT) to customize our affirmation sequences. 
            All prompt exchanges are encrypted in transit. 
            AI providers are bound by strict processing agreements preventing them from training models on your inputs or utilizing your data for public services.
          </Text>

          <Text style={styles.sectionHeading}>⚙️ 4. GDPR Compliance & Data Control</Text>
          <Text style={styles.paragraph}>
            You maintain full ownership of your data:
            - **Export:** You can share and download visual affirmation cards anytime.
            - **Deletion:** You can permanently close your account and request complete erasure of all registered profile records, mood histories, and generated cards directly from your profile settings page.
          </Text>

          <Text style={styles.sectionHeading}>📫 5. Contact Us</Text>
          <Text style={styles.paragraph}>
            For privacy inquiries or detailed operational metrics, contact us at support@iamwell.app.
          </Text>
        </GlassCard>
      </ScrollView>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 56 : 32,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DM-Sans",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  backBtnText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    fontFamily: "DM-Sans",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    fontSize: 24,
    fontFamily: "Cormorant_700Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    fontFamily: "DM-Sans",
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontFamily: "DM-Sans",
    fontWeight: "700",
    color: "#f3f4f6",
    marginTop: 18,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: "DM-Sans",
    marginBottom: 12,
  },
});
