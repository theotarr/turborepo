import { useEffect } from "react";
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

  return <Stack />;
}
