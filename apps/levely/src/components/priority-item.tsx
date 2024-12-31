import type { Href } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import type { Stats } from "~/types/types";
import { GradientText } from "./ui/gradient-text";

export const PriorityItem = ({
  stat,
  title,
  priority,
}: {
  stat: keyof Stats;
  title: string;
  priority: string;
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.replace(`/daily/${stat}` as Href<string>)}
      className="rounded-xl bg-foreground p-4"
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <SymbolView name="brain.head.profile" size={20} tintColor="#000000" />
          <Text className="ml-2 text-xl font-semibold text-secondary-foreground">
            {title}
          </Text>
        </View>
        <SymbolView name="arrow.up.right" size={16} tintColor="#000000" />
      </View>
      <GradientText
        colors={["#0B8EF8", "#BD60F4", "#EC447A"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.25, y: 0 }}
        className="font-medium"
        text={priority}
        height={20}
      />
    </TouchableOpacity>
  );
};
