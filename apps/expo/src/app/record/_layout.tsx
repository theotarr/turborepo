import { SafeAreaView } from "react-native";
import { Stack } from "expo-router";

export default function RecordLayout() {
  return (
    <SafeAreaView className="h-full">
      <Stack screenOptions={{ headerShown: false, title: "Live Lecture" }} />
    </SafeAreaView>
  );
}
