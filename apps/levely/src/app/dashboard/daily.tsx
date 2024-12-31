import { SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Stack } from "expo-router";

import { PriorityItem } from "~/components/priority-item";

export default function Daily() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
      <View className="mx-4 mt-8 flex-1">
        <ScrollView>
          <View className="flex-col gap-y-4">
            <PriorityItem
              title="Improve your focus"
              priority="First priority"
            />
            <PriorityItem
              title="Improve your memory"
              priority="Second priority"
            />
            <PriorityItem title="Stay disciplined" priority="Third priority" />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
