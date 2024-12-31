import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";

import { NavigationBar } from "~/components/nav";

export default function DashboardLayout() {
  return (
    <View className="h-full flex-1">
      <Stack.Screen options={{ header: () => <></> }} />
      <Stack />
      <NavigationBar />
    </View>
  );
}
