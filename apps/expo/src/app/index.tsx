import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, Stack } from "expo-router";
import { Aperture, ArrowDownRight } from "lucide-react-native";

import { TrustPilot } from "~/components/trust-pilot";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { useSignIn, useUser } from "~/utils/auth";

export default function Page() {
  const user = useUser();
  const signIn = useSignIn();
  const { colorScheme } = useColorScheme();

  if (user) {
    return <Redirect href={"/(dashboard)/dashboard"} />;
  }

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "" }} />
      <View className="flex h-full w-full flex-col justify-between p-6">
        <View className="mb-28 flex flex-1 items-center justify-center">
          <View className="flex flex-col items-center gap-4">
            <View className="flex flex-row items-center justify-center gap-2 rounded-full bg-primary-foreground p-2 dark:bg-transparent">
              <Aperture
                size={20}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
              <Text className="text-xl font-semibold tracking-tighter text-secondary-foreground">
                KnowNotes
              </Text>
            </View>
            <Text className="text-center text-5xl font-bold leading-tight tracking-tighter text-secondary-foreground">
              The AI Assistant{"\n"} For Students
            </Text>
            <View className="mt-4">
              <TrustPilot />
            </View>
          </View>
        </View>
        <View className="relative w-full">
          <Button
            variant="outline"
            className="flex w-full flex-row gap-2 rounded-full"
            size="lg"
            onPress={() => signIn()}
          >
            <Aperture
              size={20}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text className="font-semibold">Continue on KnowNotes.ai</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
