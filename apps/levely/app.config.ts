import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "theotarr",
  name: "Levely",
  slug: "levely",
  scheme: "levely",
  version: "0.1.0",
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
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    bundleIdentifier: "ai.levely.ios",
    usesAppleSignIn: true,
    supportsTablet: true,
    associatedDomains: ["applinks:levely.ai"],
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Need microphone access for recording audio",
      NSSpeechRecognitionUsageDescription:
        "Need speech recognition access for voice commands",
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
  // extra: {
  //   eas: {
  //     projectId: "d9ca89f3-c9ca-436e-a31b-0273a7df86cb",
  //   },
  // },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
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
