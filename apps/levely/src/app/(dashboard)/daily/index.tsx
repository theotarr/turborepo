import { useEffect, useState } from "react";
import { ImageBackground, SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Stack } from "expo-router";

import type { Stats } from "~/types/types";
import { PriorityItem } from "~/components/priority-item";
import { getHighestPriorities } from "~/lib/tips";
import { numberToOrdinal } from "~/lib/utils";

export default function Daily() {
  const [priorities, setPriorities] = useState<
    {
      stat: keyof Stats;
      title: string;
    }[]
  >([]);

  useEffect(() => {
    void (async () => {
      const priorities = await getHighestPriorities();
      setPriorities(priorities);
    })();
  }, []);

  return (
    <ImageBackground
      source={require("~/../assets/background.png")}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="mx-4 mt-8 flex-1">
          <ScrollView>
            <View className="flex-col gap-y-4">
              {priorities.map((priority, index) => (
                <PriorityItem
                  key={index}
                  stat={priority.stat}
                  title={priority.title}
                  priority={`${numberToOrdinal(index + 1)} priority`}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
