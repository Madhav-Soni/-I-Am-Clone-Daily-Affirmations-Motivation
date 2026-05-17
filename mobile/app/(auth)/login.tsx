import { useState } from "react";
import { StyleSheet, TextInput, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import { routes } from "@/constants/routes";
import { authApi } from "@/services/api/modules/auth";
import { useAuthStore } from "@/store";
import {
  DisplayText,
  BodyText,
  FullscreenScreen,
  GlassCard,
  PrimaryButton,
  GhostButton,
  Text,
} from "@/shared/components/primitives";
import { colors } from "@/theme/tokens";
import { fontFamily } from "@/theme/typography";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginStore = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login({ email });
      if (response?.data?.user) {
        await loginStore(response.data.user, response.data.accessToken, response.data.refreshToken);
        router.replace(routes.bootstrap);
      } else {
        setError("Invalid response from server.");
      }
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FullscreenScreen gradient="dusk" contentClassName="justify-center py-6 padded">
      <Animated.View entering={fadeInUp} style={styles.container}>
        <View style={styles.header}>
          <DisplayText color="primary" align="center">Welcome back</DisplayText>
          <BodyText color="secondary" align="center">
            Sign in to continue your daily ritual.
          </BodyText>
        </View>

        <GlassCard padding="lg" animated={false}>
          <View style={styles.form}>
            {error && (
              <Text variant="caption" color="accent" style={styles.errorText}>
                {error}
              </Text>
            )}

            <View style={styles.inputGroup}>
              <Text variant="caption" color="muted">Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E.g. madhav@domain.com"
                placeholderTextColor={colors.text.faint}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                selectionColor={colors.luxury.accentSoft}
              />
            </View>

            <PrimaryButton 
              fullWidth 
              size="lg" 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#ffffff" /> : "Sign In"}
            </PrimaryButton>
          </View>
        </GlassCard>

        <GhostButton 
          fullWidth 
          size="md" 
          onPress={() => router.replace(routes.auth.register)}
        >
          Don't have an account? Sign up
        </GhostButton>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 32,
  },
  header: {
    gap: 12,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.15)",
    paddingVertical: 8,
  },
  errorText: {
    textAlign: "center",
    color: "#ef4444",
  },
});
