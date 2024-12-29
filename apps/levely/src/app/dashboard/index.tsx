import { SafeAreaView } from "react-native";
import { Stack } from "expo-router";

export default function Dashboard() {
  return (
    <SafeAreaView>
      <Stack.Screen options={{ title: "Dashboard" }} />
    </SafeAreaView>
  );
}
