import { FadeIn, FadeInUp, ZoomIn } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

const bloom = { damping: 30, stiffness: 90 };

export const celebrationBloom = FadeIn.duration(duration.cinematic);

export const celebrationFlameEnter = ZoomIn.duration(duration.cinematic)
  .delay(200)
  .springify()
  .damping(bloom.damping)
  .stiffness(bloom.stiffness);

export const celebrationCopyEnter = FadeInUp.duration(duration.slow)
  .delay(480)
  .springify()
  .damping(bloom.damping)
  .stiffness(bloom.stiffness);

export const celebrationRingEnter = FadeInUp.duration(duration.slow)
  .delay(720)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const celebrationMilestoneEnter = FadeInUp.duration(duration.standard)
  .delay(960)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const celebrationCtaEnter = FadeInUp.duration(duration.standard)
  .delay(1180)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);
