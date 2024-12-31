import { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
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
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
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
  );
}
