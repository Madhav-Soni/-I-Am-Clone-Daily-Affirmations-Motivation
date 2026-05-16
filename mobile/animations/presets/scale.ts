import { ZoomIn, ZoomOut } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

export const scaleIn = ZoomIn.duration(duration.standard)
  .springify()
  .damping(spring.snappy.damping)
  .stiffness(spring.snappy.stiffness);

export const scaleOut = ZoomOut.duration(duration.fast);

export const scaleReveal = ZoomIn.duration(duration.cinematic)
  .springify()
  .damping(spring.soft.damping)
  .stiffness(spring.soft.stiffness);
