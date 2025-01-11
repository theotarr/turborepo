import React from "react";
import { Pressable, View } from "react-native";

import { GradientBorderView } from "./ui/gradient-view";
import { Text } from "./ui/text";

export interface QuestionOptionProps {
  text: string;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const QuestionItem = ({
  text,
  isSelected,
  onSelect,
  className,
}: QuestionOptionProps) => {
  return (
    <GradientBorderView
      className="relative overflow-hidden rounded-xl"
      gradientProps={{
        colors: ["#007AFF", "#BD60F4", "#EC447A"],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
      }}
      style={[
        {
          borderWidth: isSelected ? 2.5 : 0,
          borderRadius: 12,
          marginBottom: 16,
        },
      ]}
    >
      <Pressable onPress={onSelect} className={className}>
        <View className="rounded-xl bg-foreground px-[18px] py-4">
          <Text className="text-[17px] font-medium leading-[22px] text-secondary-foreground">
            {text}
          </Text>
        </View>
      </Pressable>
    </GradientBorderView>
  );
};
