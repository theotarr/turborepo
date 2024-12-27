import "@bacons/text-decoder/install";

import * as React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";

import "../globals.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export default function RootLayout() {
  return (
    <TRPCProvider>
      <GestureHandlerRootView>
        <StatusBar />
        <Stack />
      </GestureHandlerRootView>
    </TRPCProvider>
  );
}
