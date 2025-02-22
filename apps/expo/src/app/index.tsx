import { useEffect } from "react";
import { Dimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ResizeMode, Video } from "expo-av";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Superwall from "@superwall/react-native-superwall";

import { AuthForm } from "~/components/auth-form";
import { Text } from "~/components/ui/text";
import { api } from "~/utils/api";

const { height } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const utils = api.useUtils();
  const { isLoading, data: session } = api.auth.getSession.useQuery();

  useEffect(() => {
    if (!session) return;

    const identifyUser = async () => {
      await Superwall.shared.identify(session.user.id);
      await Superwall.shared.setUserAttributes(session.user);
    };
    void identifyUser();

    // Check if the user has completed onboarding.
    void AsyncStorage.getItem("onboardingComplete").then((value) => {
      if (value === "true") router.replace("/(dashboard)/dashboard");
      else router.replace("/onboarding");
    });
  }, [router, session, utils]);

  if (isLoading) {
    return (
      <SafeAreaView className="bg-background">
        <Stack.Screen options={{ headerShown: false }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-screen flex-col bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mt-10 flex items-center justify-center px-4">
        <Video
          source={{
            uri: "https://user-content.superwalleditor.com/user-content/Tw75anXwky2tZWtI7vHdW",
          }}
          style={{
            height: height * 0.6,
            width: "80%",
            borderRadius: 16,
          }}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={true}
        />
      </View>
      <View className="mt-12 h-full w-full rounded-t-3xl border-x border-t border-border px-4 pt-6">
        <Text className="text-center text-3xl font-semibold tracking-tight">
          Never take notes again
        </Text>
        <AuthForm className="mt-6" />
      </View>
    </SafeAreaView>
  );
}
