import { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

const calmSpring = { damping: 26, stiffness: 110 };

/** Staggered welcome screen entrances — slow and cinematic */
export const welcomeLogoEnter = FadeInDown.duration(duration.cinematic)
  .delay(0)
  .springify()
  .damping(calmSpring.damping)
  .stiffness(calmSpring.stiffness);

export const welcomeTitleEnter = FadeIn.duration(duration.cinematic)
  .delay(160)
  .springify()
  .damping(calmSpring.damping)
  .stiffness(calmSpring.stiffness);

export const welcomeTaglineEnter = FadeInUp.duration(duration.slow)
  .delay(320)
  .springify()
  .damping(calmSpring.damping)
  .stiffness(calmSpring.stiffness);

export const welcomeCardEnter = FadeInUp.duration(duration.slow)
  .delay(480)
  .springify()
  .damping(calmSpring.damping)
  .stiffness(calmSpring.stiffness);

export const welcomeCtaEnter = FadeInUp.duration(duration.standard)
  .delay(640)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const welcomeFooterEnter = FadeIn.duration(duration.standard).delay(780);
