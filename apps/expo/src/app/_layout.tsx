import "@bacons/text-decoder/install";

import type { Theme } from "@react-navigation/native";
import type { RouterAction } from "expo-quick-actions/router";
import { Platform } from "react-native";
import appsFlyer from "react-native-appsflyer";
import { useQuickActionRouting } from "expo-quick-actions/router";
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

import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as QuickActions from "expo-quick-actions";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { MySuperwallDelegate } from "~/lib/superwall-delegate";

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
  const delegate = new MySuperwallDelegate();
  const { colorScheme, setColorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = useState(false);

  // Enable linking to the `href` param when a quick action is used.
  useQuickActionRouting();

  // Initialize Superwall
  useEffect(() => {
    const setupSuperwall = async () => {
      const apiKey =
        Platform.OS === "ios"
          ? "pk_4c26d917d2debc8d3e77f570082055efc61abb846b7efae4"
          : "MY_ANDROID_API_KEY";
      await Superwall.configure(apiKey);
      void Superwall.shared.setDelegate(delegate);
    };

    void setupSuperwall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    appsFlyer.initSdk(
      {
        appId: "id6739503513",
        devKey: "XQ89PLX7avzrytvHTtAuqE",
        isDebug: true,
        onInstallConversionDataListener: true, // Optional
        onDeepLinkListener: true, // Optional
        timeToWaitForATTUserAuthorization: 10, // For iOS 14.5
      },
      (result) => console.log(result),
      (error) => console.error(error),
    );
  }, []);

  useEffect(() => {
    void (async () => {
      const theme = await AsyncStorage.getItem("theme");
      if (!theme) {
        void AsyncStorage.setItem("theme", "light"); // Default to light theme.
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

  useEffect(() => {
    void QuickActions.setItems<RouterAction>([
      {
        title: "Deleteing? Tell us why.",
        subtitle: "Send feedback before you delete.",
        icon: Platform.OS === "ios" ? "symbol:square.and.pencil" : undefined,
        id: "0",
        params: {
          href: "mailto:support@knownotes.ai",
        },
      },
    ]);
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
