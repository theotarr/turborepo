import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";

export interface OnboardingQuestionItemProps {
  text: string;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const OnboardingQuestionItem = ({
  text,
  isSelected,
  onSelect,
  className,
}: OnboardingQuestionItemProps) => {
  const { colorScheme } = useColorScheme();
  const handlePress = () => {
    if (onSelect) {
      onSelect();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isSelected
          ? NAV_THEME[colorScheme].primary
          : NAV_THEME[colorScheme].muted,
        { duration: 100 },
      ),
    };
  }, [isSelected]);

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(
        isSelected
          ? NAV_THEME[colorScheme].primaryForeground
          : NAV_THEME[colorScheme].secondaryForeground,
        { duration: 100 },
      ),
    };
  }, [isSelected]);

  return (
    <Animated.View
      style={[animatedStyle]}
      className="w-full overflow-hidden rounded-xl"
    >
      <Pressable onPress={handlePress} className={className}>
        <View className="flex-row gap-x-4 rounded-xl px-5 py-4">
          {/* {icon && (
            <icon.name
              size={24}
              color={NAV_THEME[colorScheme].primaryForeground}
            />
          )} */}
          <Animated.Text
            style={[
              animatedTextStyle,
              {
                fontWeight: 500,
              },
            ]}
            className="text-lg"
          >
            {text}
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};
