module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "@/app": "./app",
            "@/features": "./features",
            "@/shared": "./shared",
            "@/hooks": "./hooks",
            "@/services": "./services",
            "@/store": "./store",
            "@/animations": "./animations",
            "@/constants": "./constants",
            "@/theme": "./theme",
            "@/assets": "./assets",
          },
          extensions: [".ios.js", ".android.js", ".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
