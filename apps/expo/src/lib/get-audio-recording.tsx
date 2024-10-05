import { Platform } from "react-native";

export const getAudioConfig = () => {
  const audioConfig = {
    encoding:
      Platform.OS === "android"
        ? "amr-wb"
        : Platform.OS === "web"
          ? "opus"
          : "linear16",
    sampleRateHertz:
      Platform.OS === "android" ? 16000 : Platform.OS === "web" ? 48000 : 41000,
    languageCode: "en-US",
  };

  return audioConfig;
};
