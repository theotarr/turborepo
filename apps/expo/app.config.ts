import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "theotarr",
  name: "KnowNotes",
  slug: "knownotes",
  scheme: "ai.knownotes",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "ai.knownotes.mobile",
    supportsTablet: true,
  },
  android: {
    package: "ai.knownotes.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  extra: {
    eas: {
      projectId: "d9ca89f3-c9ca-436e-a31b-0273a7df86cb",
    },
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: ["expo-router"],
});
