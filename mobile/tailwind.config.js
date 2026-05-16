/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        surface: {
          DEFAULT: "#070b14",
          elevated: "#121a2e",
          muted: "#1e293b",
        },
        luxury: {
          void: "#030508",
          midnight: "#070b14",
          accent: "#8b5cf6",
          teal: "#2dd4bf",
          gold: "#d4a574",
        },
      },
      fontFamily: {
        sans: ["DMSans_400Regular"],
        "sans-medium": ["DMSans_500Medium"],
        "sans-bold": ["DMSans_700Bold"],
        display: ["Cormorant_500Medium"],
        "display-semibold": ["Cormorant_600SemiBold"],
        "display-bold": ["Cormorant_700Bold"],
      },
      borderRadius: {
        card: "20px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
