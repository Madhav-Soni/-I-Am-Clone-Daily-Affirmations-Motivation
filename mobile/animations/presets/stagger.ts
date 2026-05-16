import { FadeInUp } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

/** Base entering animation — apply `.delay(index * STAGGER_MS)` per item */
export const STAGGER_MS = 60;

export const staggerItem = (index: number) =>
  FadeInUp.duration(duration.standard)
    .delay(index * STAGGER_MS)
    .springify()
    .damping(spring.gentle.damping)
    .stiffness(spring.gentle.stiffness);
