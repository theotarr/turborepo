import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Superwall from "@superwall/react-native-superwall";
import { Aperture } from "lucide-react-native";

import { AuthForm } from "~/components/auth-form";
import { TrustPilot } from "~/components/trust-pilot";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";

export default function Page() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const { isLoading, data: session } = api.auth.getSession.useQuery();

  useEffect(() => {
    const identifyUser = async () => {
      // Identify the user in Superwall.
      // This id ends up being the `appAccountToken` in Apple webhooks.
      if (session) {
        await Superwall.shared.identify(session.user.id);
        await Superwall.shared.setUserAttributes(session.user);
      }
    };

    if (session) {
      void identifyUser();
      void AsyncStorage.getItem("onboardingComplete").then((value) => {
        if (value === "true") router.replace("/(dashboard)/dashboard");
        else router.replace("/onboarding");
      });
    }
  }, [router, session]);

  if (isLoading) return <Stack.Screen options={{ title: "" }} />;

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full w-full flex-col p-4">
        <View className="mt-16 flex flex-col items-center gap-4">
          <View className="mb-2 flex flex-row items-center gap-2">
            <Aperture
              size={20}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text className="text-xl font-semibold tracking-tighter text-secondary-foreground">
              KnowNotes
            </Text>
          </View>
          <Text className="text-center text-5xl font-bold tracking-tighter text-secondary-foreground">
            The AI Assistant{"\n"} For Students
          </Text>
          <TrustPilot />
        </View>
        <AuthForm className="mt-auto" />
      </View>
    </SafeAreaView>
  );
}
