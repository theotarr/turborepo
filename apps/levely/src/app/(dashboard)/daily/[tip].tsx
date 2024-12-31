import { useState } from "react";
import { SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Stack, useGlobalSearchParams } from "expo-router";

import { TipItem } from "~/components/tip-item";
import { tips as tipsData } from "~/lib/tips";

export default function Tip() {
  const { tip } = useGlobalSearchParams();
  if (!tip || typeof tip !== "string")
    throw new Error("Unreachable, tip not found.");

  const [tips, setTips] = useState<
    {
      title: string;
      description: string;
      stars: number;
      link?: string;
    }[]
  >(tipsData[tip as keyof typeof tipsData]);

  console.log(tips);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
      <View className="mx-4 mt-8 flex-1">
        <ScrollView>
          <View className="flex-col gap-y-4">
            {tips.map((tip, index) => (
              <TipItem
                key={index}
                title={tip.title}
                stars={tip.stars}
                description={tip.description}
                link={tip.link}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
