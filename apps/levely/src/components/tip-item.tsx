import type { Href } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { GradientText } from "./ui/gradient-text";

export const TipItem = ({
  title,
  description,
  stars,
  link,
}: {
  title: string;
  description: string;
  stars: number;
  link?: string;
}) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => link && router.replace(link as Href<string>)}
      className="rounded-xl bg-foreground p-4"
    >
      <View className="absolute right-4 top-4 flex-row gap-x-1">
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
        {[...Array(stars)].map((_, i) => (
          <SymbolView
            key={i}
            name="star.fill"
            size={16}
            resizeMode="scaleAspectFit"
            tintColor="black"
          />
        ))}
      </View>
      {stars > 1 ? (
        <GradientText
          colors={["#0B8EF8", "#BD60F4", "#EC447A"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.25, y: 0 }}
          text={title}
          className="text-xl font-semibold"
          height={24}
        />
      ) : (
        <Text className="text-xl font-medium text-secondary-foreground">
          {title}
        </Text>
      )}
      <Text className="mt-2 text-sm text-secondary-foreground">
        {description}
      </Text>
    </TouchableOpacity>
  );
};
