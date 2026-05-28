import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { usePressAnimation } from "@/animations/hooks";
import { Text } from "@/shared/components/primitives/Text";
import { colors, radius } from "@/theme/tokens";
import { cn } from "@/shared/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "glass";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = PressableProps & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  className?: string;
};

const sizeStyles = {
  sm: { height: 44, paddingHorizontal: 20 },
  md: { height: 52, paddingHorizontal: 28 },
  lg: { height: 58, paddingHorizontal: 32 },
};

const sizeText = {
  sm: "caption" as const,
  md: "bodyMedium" as const,
  lg: "bodyMedium" as const,
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation({
    disabled: !!isDisabled,
  });

  const content = (
    <View style={[styles.content, sizeStyles[size]]}>
      {loading ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator
            color={variant === "ghost" || variant === "glass" ? colors.text.secondary : colors.luxury.void}
            size="small"
          />
          {loadingText ? (
            <Text
              variant={sizeText[size]}
              color={variant === "ghost" || variant === "glass" ? "secondary" : "primary"}
              style={variant === "primary" ? styles.primaryLabel : undefined}
            >
              {loadingText}
            </Text>
          ) : null}
        </View>
      ) : typeof children === "string" ? (
        <Text
          variant={sizeText[size]}
          color={variant === "ghost" || variant === "glass" ? "secondary" : "primary"}
          style={variant === "primary" ? styles.primaryLabel : undefined}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );

  return (
    <Animated.View
      style={[animatedStyle, fullWidth && styles.fullWidth]}
      className={cn(className)}
    >
      <Pressable
        disabled={isDisabled}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.pressable, isDisabled && styles.disabled]}
        {...props}
      >
        {variant === "primary" ? (
          <LinearGradient
            colors={[colors.luxury.accent, colors.luxury.tealMuted]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, sizeStyles[size]]}
          >
            {content}
          </LinearGradient>
        ) : variant === "secondary" ? (
          <View style={[styles.secondary, sizeStyles[size]]}>{content}</View>
        ) : variant === "glass" ? (
          <View style={[styles.glass, sizeStyles[size]]}>{content}</View>
        ) : (
          <View style={[styles.ghost, sizeStyles[size]]}>{content}</View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}

export function GhostButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="ghost" {...props} />;
}

export function GlassButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="glass" {...props} />;
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  gradient: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  glass: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.surface.glassBorder,
  },
  ghost: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryLabel: {
    color: colors.luxury.void,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.45,
  },
});
