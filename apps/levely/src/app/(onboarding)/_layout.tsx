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

  return (
    <View className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      {!isLoading && <Stack />}
    </View>
  );
}
