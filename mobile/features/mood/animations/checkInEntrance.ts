import { FadeIn, FadeInUp } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

const calm = { damping: 26, stiffness: 110 };

export const checkInPromptEnter = FadeInUp.duration(duration.cinematic)
  .delay(0)
  .springify()
  .damping(calm.damping)
  .stiffness(calm.stiffness);

export const checkInMoodEnter = FadeIn.duration(duration.slow).delay(200);

export const checkInHintEnter = FadeInUp.duration(duration.standard)
  .delay(400)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const checkInReflectionEnter = FadeInUp.duration(duration.slow)
  .delay(120)
  .springify()
  .damping(calm.damping)
  .stiffness(calm.stiffness);

export const checkInInputEnter = FadeInUp.duration(duration.standard)
  .delay(280)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const checkInCtaEnter = FadeInUp.duration(duration.standard)
  .delay(420)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);
