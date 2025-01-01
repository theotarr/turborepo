import { SafeAreaView, View } from "react-native";
import { Stack } from "expo-router";

import { TestItem } from "~/components/test-item";
import { sections } from "~/lib/tests";

export default function Retake() {
  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mx-4 mt-8 flex-col gap-y-4">
        {sections.map((test) => (
          <TestItem
            key={test.name}
            test={`${test.name} test`}
            href={test.href}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}
