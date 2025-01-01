import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { getOnboardingComplete } from "~/lib/storage";

export default function OnboardingLayout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const hasOnboarded = await getOnboardingComplete();
      if (hasOnboarded) router.replace("/dashboard");
      setIsLoading(false);
    })();
  }, [router]);

  if (isLoading)
    return (
      <View className="h-full flex-1 bg-background">
        <Stack.Screen
          options={{
            title: "Onboarding",
            header: () => <></>,
          }}
        />
      </View>
    );

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
