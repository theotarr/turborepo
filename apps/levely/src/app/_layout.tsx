import "@bacons/text-decoder/install";

import type { Theme } from "@react-navigation/native";
import * as React from "react";
import { Platform } from "react-native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider } from "@react-navigation/native";
import Superwall from "@superwall/react-native-superwall";

import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { TRPCProvider } from "~/utils/api";

import "../globals.css";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

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
      <GestureHandlerRootView>
        <BottomSheetModalProvider>
          <ThemeProvider value={LIGHT_THEME}>
            <StatusBar style="light" />
            <Stack />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </TRPCProvider>
  );
}
