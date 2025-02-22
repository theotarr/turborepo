import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "theotarr",
  name: "KnowNotes",
  slug: "knownotes",
  scheme: "knownotes",
  version: "0.1.11",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#FFFFFF",
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/d9ca89f3-c9ca-436e-a31b-0273a7df86cb",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    buildNumber: "1",
    bundleIdentifier: "ai.knownotes.ios",
    usesAppleSignIn: true,
    supportsTablet: true,
    associatedDomains: ["applinks:knownotes.ai"],
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Need microphone access for recording audio",
      UIBackgroundModes: ["audio"],
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: "ai.knownotes.ios",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
    permissions: ["WAKE_LOCK"],
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
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    [
      "expo-updates",
      {
        username: "theotarr",
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 26,
        },
      },
    ],
    ["react-native-appsflyer", {}],
  ],
});
