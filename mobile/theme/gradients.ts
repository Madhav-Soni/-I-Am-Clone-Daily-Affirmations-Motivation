export type GradientPreset = "aurora" | "dusk" | "ocean" | "ember" | "void";

export type GradientDefinition = {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/**
 * Cinematic fullscreen gradient presets.
 * Layered under ambient blobs for depth.
 */
export const gradientPresets: Record<GradientPreset, GradientDefinition> = {
  void: {
    colors: ["#030508", "#070b14", "#0c1222"],
    locations: [0, 0.5, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  aurora: {
    colors: ["#030508", "#0c1222", "#14102a", "#1e1b4b", "#0c4a6e"],
    locations: [0, 0.25, 0.5, 0.75, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  dusk: {
    colors: ["#030508", "#14102a", "#2e1065", "#4c1d95", "#1e1b4b"],
    locations: [0, 0.35, 0.6, 0.8, 1],
    start: { x: 0.2, y: 0 },
    end: { x: 0.8, y: 1 },
  },
  ocean: {
    colors: ["#030508", "#0c1222", "#0c4a6e", "#134e4a", "#070b14"],
    locations: [0, 0.3, 0.55, 0.8, 1],
    start: { x: 0, y: 0.3 },
    end: { x: 1, y: 0.9 },
  },
  ember: {
    colors: ["#030508", "#1a1033", "#451a03", "#7c2d12", "#0c1222"],
    locations: [0, 0.4, 0.65, 0.85, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
};
