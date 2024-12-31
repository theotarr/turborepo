import "@bacons/text-decoder/install";

import type { Theme } from "@react-navigation/native";
import * as React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@react-navigation/native";

import { NAV_THEME } from "~/lib/constants";
import { TRPCProvider } from "~/utils/api";

import "../globals.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PostHogProvider } from "posthog-react-native";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const LIGHT_THEME: Theme = {
  dark: false,
  colors: NAV_THEME.light,
};

export default function RootLayout() {
  return (
    <TRPCProvider>
      <PostHogProvider
        apiKey="phc_UUGaxECpebe607OnNeXeFhvHnPLiF4k4VYxMBi1O6v2"
        options={{
          host: "https://us.i.posthog.com",
          enableSessionReplay: true,
          sessionReplayConfig: {
            // Whether text inputs are masked. Default is true.
            // Password inputs are always masked regardless
            maskAllTextInputs: true,
            // Whether images are masked. Default is true.
            maskAllImages: true,
            // Capture logs automatically. Default is true.
            // Android only (Native Logcat only)
            captureLog: true,
            // Whether network requests are captured in recordings. Default is true
            // Only metric-like data like speed, size, and response code are captured.
            // No data is captured from the request or response body.
            // iOS only
            captureNetworkTelemetry: true,
            // Deboucer delay used to reduce the number of snapshots captured and reduce performance impact. Default is 500ms
            androidDebouncerDelayMs: 500,
            // Deboucer delay used to reduce the number of snapshots captured and reduce performance impact. Default is 1000ms
            iOSdebouncerDelayMs: 1000,
          },
        }}
      >
        <GestureHandlerRootView>
          <ThemeProvider value={LIGHT_THEME}>
            <StatusBar style="light" />
            <Stack />
          </ThemeProvider>
        </GestureHandlerRootView>
      </PostHogProvider>
    </TRPCProvider>
  );
}
