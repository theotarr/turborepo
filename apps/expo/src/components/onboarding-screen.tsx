import React from "react";
import { useWindowDimensions, View } from "react-native";

import { cn } from "~/lib/utils";
import { Text } from "./ui/text";

interface Props {
  item: {
    text?: string;
    description?: string;
    content: React.ReactNode;
    containerClassName?: string;
  };
}

const OnboardingScreen = ({ item }: Props) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  return (
    <View className="w-full flex-1" style={{ width: SCREEN_WIDTH }}>
      <View className="mx-6 mt-2">
        <Text className="text-[2rem] font-semibold leading-tight tracking-tighter text-secondary-foreground">
          {item.text}
        </Text>
        <Text className="mt-2 text-lg text-muted-foreground">
          {item.description}
        </Text>
      </View>
      <View
        className={cn(
          "w-full flex-1 flex-col items-center",
          item.containerClassName,
        )}
      >
        {item.content}
      </View>
    </View>
  );
};

export default React.memo(OnboardingScreen);
