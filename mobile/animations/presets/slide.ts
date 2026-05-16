import { SlideInDown, SlideInUp, SlideOutDown } from "react-native-reanimated";
import { duration, spring } from "@/theme/motion";

export const slideUp = SlideInUp.duration(duration.slow)
  .springify()
  .damping(spring.gentle.damping)
  .stiffness(spring.gentle.stiffness);

export const slideUpFooter = SlideInUp.duration(duration.standard)
  .springify()
  .damping(spring.snappy.damping)
  .stiffness(spring.snappy.stiffness);

export const slideInDown = SlideInDown.duration(duration.standard)
  .springify()
  .damping(spring.gentle.damping);

export const slideOutDown = SlideOutDown.duration(duration.fast);
