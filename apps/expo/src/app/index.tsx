import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, Stack } from "expo-router";
import { Aperture } from "lucide-react-native";

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
      <View className="h-full w-full p-4">
        <View className="flex h-full flex-col items-center justify-between gap-4">
          <View className="flex flex-col items-center gap-6">
            <TrustPilot />
            <Text className="text-center text-4xl font-bold leading-tight tracking-tighter text-secondary-foreground">
              The AI Assitant{"\n"} For Students
            </Text>
            <Text className="max-w-sm text-center text-lg text-muted-foreground">
              KnowNotes transcribes lectures and creates detailed notes,
              flashcards, and quizzes so you can ace your classes easily.
            </Text>
          </View>
          <View className="mb-8 w-full">
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
              <Text>Continue on KnowNotes.ai</Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
