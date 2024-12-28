import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

import { cn } from "../lib/utils";
import { GradientBorderView } from "./ui/gradient-view";
import { Text } from "./ui/text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isSelected ? 1.02 : 1, {
            mass: 0.5,
            damping: 12,
          }),
        },
      ],
      //   shadowOpacity: withTiming(isSelected ? 0.15 : 0),
      //   shadowRadius: withTiming(isSelected ? 10 : 0),
    };
  });

  const gradientStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isSelected ? 1 : 0, {
        duration: 200,
      }),
    };
  });

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
          //   height: 50,
          //   width: 50,
        },
      ]}
    >
      <AnimatedPressable
        onPress={onSelect}
        className={className}
        style={
          [
            //   containerStyle,
            // {
            //   shadowColor: "#000",
            //   shadowOffset: { width: 0, height: 4 },
            // },
          ]
        }
      >
        {/* Content Container */}
        <View className="m-px rounded-xl bg-foreground px-4 py-3">
          <Text className="text-base font-medium text-secondary-foreground">
            {text}
          </Text>
        </View>
      </AnimatedPressable>
    </GradientBorderView>
  );
};
