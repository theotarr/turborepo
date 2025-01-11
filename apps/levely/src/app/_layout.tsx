import "@bacons/text-decoder/install";

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

export default function RootLayout() {
  return (
    <TRPCProvider>
      <PostHogProvider
        apiKey="phc_UUGaxECpebe607OnNeXeFhvHnPLiF4k4VYxMBi1O6v2"
        options={{
          host: "https://us.i.posthog.com",
          enableSessionReplay: true,
          sessionReplayConfig: {
            maskAllTextInputs: false,
            maskAllImages: false,
          },
        }}
      >
        <GestureHandlerRootView>
          <ThemeProvider
            value={{
              dark: false,
              colors: NAV_THEME.light,
            }}
          >
            <StatusBar style="light" />
            <Stack />
          </ThemeProvider>
        </GestureHandlerRootView>
      </PostHogProvider>
    </TRPCProvider>
  );
}
