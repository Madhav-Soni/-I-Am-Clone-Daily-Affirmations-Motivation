import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { typography, textColor, type TypographyVariant } from "@/theme/typography";
import { cn } from "@/shared/utils/cn";

const colorMap = {
  primary: textColor.primary,
  secondary: textColor.secondary,
  muted: textColor.muted,
  faint: textColor.faint,
  accent: textColor.accent,
  gold: textColor.gold,
} as const;

export type TextColor = keyof typeof colorMap;

type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextStyle["textAlign"];
  className?: string;
};

export function Text({
  variant = "body",
  color = "primary",
  align,
  className,
  style,
  ...props
}: TextProps) {
  const variantStyle = typography[variant];

  return (
    <RNText
      className={cn(className)}
      style={[
        variantStyle,
        { color: colorMap[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    />
  );
}

/** Serif display line — hero headlines */
export function DisplayText(props: Omit<TextProps, "variant">) {
  return <Text variant="display" {...props} />;
}

export function HeadlineText(props: Omit<TextProps, "variant">) {
  return <Text variant="headline" {...props} />;
}

export function TitleText(props: Omit<TextProps, "variant">) {
  return <Text variant="title" {...props} />;
}

export function BodyText(props: Omit<TextProps, "variant">) {
  return <Text variant="body" {...props} />;
}

export function CaptionText(props: Omit<TextProps, "variant">) {
  return <Text variant="caption" color="muted" {...props} />;
}

export function LabelText(props: Omit<TextProps, "variant">) {
  return <Text variant="label" color="muted" {...props} />;
}

/** Affirmation reveal typography */
export function AffirmationText(props: Omit<TextProps, "variant">) {
  return <Text variant="affirmation" color="primary" align="center" {...props} />;
}
