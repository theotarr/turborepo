import type { Href } from "expo-router";
import React, { useState } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import Markdown from "react-native-markdown-display";
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
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    if (expanded && link) {
      router.replace(link as Href<string>);
      return;
    }

    const toValue = expanded ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      tension: 20, // Lower tension for smoother motion
    }).start();
    setExpanded(!expanded);
  };

  const maxHeight = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [link ? 36 : 28, 500, 1000], // Add midpoint for smoother interpolation
    easing: Easing.bezier(0.4, 0, 0.2, 1), // Add smooth easing curve
  });

  return (
    <TouchableOpacity
      onPress={toggleExpand}
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
      <Animated.View className="overflow-hidden" style={{ maxHeight }}>
        <Markdown>{description}</Markdown>
      </Animated.View>
    </TouchableOpacity>
  );
};
