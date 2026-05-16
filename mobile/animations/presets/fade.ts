import { Easing, FadeIn, FadeInDown, FadeInUp, FadeOut } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

export const fadeIn = FadeIn.duration(duration.standard).easing(Easing.out(Easing.cubic));

export const fadeInUp = FadeInUp.duration(duration.slow)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const fadeInDown = FadeInDown.duration(duration.slow)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const fadeOut = FadeOut.duration(duration.fast);
