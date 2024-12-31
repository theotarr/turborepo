import { SafeAreaView } from "react-native";
import { Stack } from "expo-router";

export default function Daily() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
    </SafeAreaView>
  );
}
