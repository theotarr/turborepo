import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "theotarr",
  name: "Levely",
  slug: "levely",
  scheme: "levely",
  version: "1.0.3",
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
    url: "https://u.expo.dev/ee13eb68-1d02-45bb-a9bc-dbd70fa9efa6",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "ai.levely.ios",
    supportsTablet: true,
    // associatedDomains: ["applinks:levely.app"],
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "Need photo library access for uploading images",
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: "ai.levely.ios",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  extra: {
    eas: {
      projectId: "ee13eb68-1d02-45bb-a9bc-dbd70fa9efa6",
    },
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    [
      "@react-native-voice/voice",
      {
        microphonePermission: "Allow Levely to access the microphone",
        speechRecognitionPermission:
          "Allow Levely to securely recognize user speech",
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
  ],
});
