export type ThemeColors = {
  luxury?: Record<string, string>;
  brand: Record<string, string>;
  surface: {
    base: string;
    elevated: string;
    muted: string;
    glass?: string;
    glassBorder?: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    faint?: string;
  };
  border: string;
  borderStrong?: string;
  success: string;
  warning: string;
  error: string;
};

export type AppTheme = {
  mode: "light" | "dark";
  colors: ThemeColors;
};
