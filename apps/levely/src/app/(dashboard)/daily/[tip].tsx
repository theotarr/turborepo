import { useState } from "react";
import { SafeAreaView, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Link, Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import type { Stats } from "~/types/types";
import { TipItem } from "~/components/tip-item";
import { tips as tipsData } from "~/lib/tips";
import { camelCaseToTitle } from "~/lib/utils";
import { api } from "~/utils/api";

export default function Tip() {
  const router = useRouter();
  const { tip } = useGlobalSearchParams();
  if (!tip || typeof tip !== "string")
    throw new Error("Unreachable, tip not found.");

  const [tips, _] = useState<
    {
      title: string;
      description: string;
      stars: number;
      link?: string;
    }[]
  >(tipsData[tip as keyof typeof tipsData]);
  const { data: promotions } = api.levely.getToolPromotions.useQuery({
    category: tip as keyof Stats,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: camelCaseToTitle(tip),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/daily")}
              className="flex-row items-center"
            >
              <SymbolView
                name="chevron.left"
                size={16}
                resizeMode="scaleAspectFit"
                tintColor="black"
              />
            </TouchableOpacity>
          ),
        }}
      />
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
            {promotions?.map((promo, index) => (
              <TipItem
                key={index}
                title={promo.name}
                description={promo.description}
                stars={3}
                link={promo.link}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
