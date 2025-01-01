import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { getOnboardingComplete } from "~/lib/storage";

export default function OnboardingLayout() {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const hasOnboarded = await getOnboardingComplete();
      if (hasOnboarded) router.replace("/dashboard");
    })();
  }, [router]);

  return (
    <View className="h-full flex-1">
      <Stack.Screen
        options={{
          title: "Onboarding",
          header: () => <></>,
        }}
      />
      <Stack />
    </View>
  );
}
