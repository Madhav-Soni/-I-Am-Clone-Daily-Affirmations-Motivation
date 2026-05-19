const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Monorepo support
config.watchFolders = [monorepoRoot];

// Prevent duplicate native packages
config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, "node_modules"),
  path.resolve(projectRoot, "node_modules"),
];

// Force Metro to resolve EVERYTHING from root node_modules
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) =>
      path.join(monorepoRoot, "node_modules", name),
  }
);

module.exports = withNativeWind(config, {
  input: "./global.css",
});
