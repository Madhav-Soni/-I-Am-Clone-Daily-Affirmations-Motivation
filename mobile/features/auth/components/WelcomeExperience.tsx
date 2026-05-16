import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { useFloat } from "@/animations/hooks";
import {
  welcomeCardEnter,
  welcomeCtaEnter,
  welcomeFooterEnter,
  welcomeLogoEnter,
  welcomeTaglineEnter,
  welcomeTitleEnter,
} from "@/features/auth/animations/welcomeEntrance";
import { WELCOME_BLOBS, WELCOME_COPY } from "@/features/auth/constants/welcome";
import { WelcomeLogoMark } from "@/features/auth/components/WelcomeLogoMark";
import { routes } from "@/constants/routes";
import {
  AffirmationText,
  FullscreenScreen,
  GhostButton,
  GlassCard,
  LabelText,
  PrimaryButton,
  Text,
} from "@/shared/components/primitives";

export function WelcomeExperience() {
  const heroFloat = useFloat({ amplitude: 10, durationMs: 5200 });
  const cardFloat = useFloat({ amplitude: 5, durationMs: 6800, delayMs: 400 });

  return (
    <FullscreenScreen
      gradient="dusk"
      blobConfigs={WELCOME_BLOBS}
      contentClassName="justify-between py-4"
      padded
    >
      {/* Hero — logo, title, tagline */}
      <View style={styles.hero}>
        <Animated.View entering={welcomeLogoEnter} style={styles.heroInner}>
          <Animated.View style={heroFloat}>
            <WelcomeLogoMark />
            <Animated.View entering={welcomeTitleEnter}>
              <Text
                variant="displayLg"
                align="center"
                color="primary"
                style={styles.title}
              >
                {WELCOME_COPY.title}
              </Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={welcomeTaglineEnter} style={styles.taglineWrap}>
          <Text variant="headline" align="center" color="secondary" style={styles.tagline}>
            {WELCOME_COPY.tagline}
          </Text>
        </Animated.View>
      </View>

      {/* Affirmation preview */}
      <Animated.View entering={welcomeCardEnter} style={styles.cardWrap}>
        <Animated.View style={cardFloat}>
          <GlassCard animated={false} padding="lg" intensity={48}>
            <LabelText color="accent" style={styles.cardLabel}>
              {WELCOME_COPY.affirmationLabel}
            </LabelText>
            <AffirmationText style={styles.affirmation}>
              {WELCOME_COPY.affirmation}
            </AffirmationText>
          </GlassCard>
        </Animated.View>
      </Animated.View>

      {/* CTAs */}
      <Animated.View entering={welcomeCtaEnter} style={styles.ctaBlock}>
        <PrimaryButton
          fullWidth
          size="lg"
          onPress={() => router.push(routes.auth.register)}
        >
          {WELCOME_COPY.ctaPrimary}
        </PrimaryButton>

        <Animated.View entering={welcomeFooterEnter}>
          <GhostButton
            fullWidth
            size="md"
            onPress={() => router.push(routes.auth.login)}
          >
            {WELCOME_COPY.ctaSecondary}
          </GhostButton>
        </Animated.View>
      </Animated.View>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
  },
  heroInner: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  taglineWrap: {
    marginTop: 20,
    paddingHorizontal: 12,
    maxWidth: 300,
  },
  tagline: {
    opacity: 0.9,
  },
  cardWrap: {
    marginBottom: 28,
  },
  cardLabel: {
    marginBottom: 12,
    textAlign: "center",
  },
  affirmation: {
    paddingHorizontal: 4,
  },
  ctaBlock: {
    gap: 12,
    paddingBottom: 8,
  },
});
