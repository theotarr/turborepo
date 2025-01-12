import "@bacons/text-decoder/install";

import type { Theme } from "@react-navigation/native";
import * as React from "react";
import { Platform } from "react-native";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import Superwall from "@superwall/react-native-superwall";
import { PostHogProvider } from "posthog-react-native";

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
const DARK_THEME: Theme = {
  dark: true,
  colors: NAV_THEME.dark,
};

// Prevent the splash screen from auto-hiding before getting the color scheme.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  // Initialize Superwall
  React.useEffect(() => {
    const apiKey =
      Platform.OS === "ios"
        ? "pk_4c26d917d2debc8d3e77f570082055efc61abb846b7efae4"
        : "MY_ANDROID_API_KEY";
    void Superwall.configure(apiKey);
  }, []);

  React.useEffect(() => {
    void (async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (!theme) {
        void AsyncStorage.setItem("theme", colorScheme);
        setIsColorSchemeLoaded(true);
        return;
      }
      const colorTheme = theme === "dark" ? "dark" : "light";
      if (colorTheme !== colorScheme) {
        setColorScheme(colorTheme);

        setIsColorSchemeLoaded(true);
        return;
      }
      setIsColorSchemeLoaded(true);
    })().finally(() => {
      void SplashScreen.hideAsync();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isColorSchemeLoaded) return null;

  return (
    <TRPCProvider>
      <PostHogProvider
        apiKey="phc_uGg696hoHiBtBzNUOewiFEpiIBwrsl7T9UdLeK6xmkz"
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
          <BottomSheetModalProvider>
            <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
              <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
              <Stack />
              <PortalHost />
            </ThemeProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </PostHogProvider>
    </TRPCProvider>
  );
}
