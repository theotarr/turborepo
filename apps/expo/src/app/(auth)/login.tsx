import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Aperture } from "lucide-react-native";

import { AuthForm } from "~/components/auth-form";
import { TrustPilot } from "~/components/trust-pilot";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";

export default function Page() {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex h-full w-full flex-col justify-between p-4">
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
        <AuthForm />
      </View>
    </SafeAreaView>
  );
}
