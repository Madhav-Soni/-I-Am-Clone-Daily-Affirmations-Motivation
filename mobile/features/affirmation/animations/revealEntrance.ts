import { FadeIn, FadeInUp, ZoomIn } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

const cinematic = { damping: 28, stiffness: 100 };

export const revealAnticipationEnter = FadeIn.duration(duration.cinematic).delay(0);

export const revealThinkingEnter = ZoomIn.duration(duration.slow)
  .springify()
  .damping(cinematic.damping)
  .stiffness(cinematic.stiffness);

export const revealTextEnter = FadeInUp.duration(duration.cinematic)
  .springify()
  .damping(cinematic.damping)
  .stiffness(cinematic.stiffness);

export const revealReflectionEnter = FadeIn.duration(duration.slow);

export const revealActionsEnter = FadeInUp.duration(duration.standard)
  .delay(120)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const revealStreakEnter = FadeInUp.duration(duration.standard)
  .delay(200)
  .springify()
  .damping(spring.soft.damping)
  .stiffness(spring.soft.stiffness);
