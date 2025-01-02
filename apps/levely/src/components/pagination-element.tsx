import type { SharedValue } from "react-native-reanimated";
import React, { useCallback } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";

import { NAV_THEME } from "~/lib/constants";

interface Props {
  length: number;
  x: SharedValue<number>;
}

export const PaginationElement = ({ length, x }: Props) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const PaginationComponent = useCallback(({ index }: { index: number }) => {
    const itemRnStyle = useAnimatedStyle(() => {
      const width = interpolate(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [35, 16, 35],
        Extrapolation.CLAMP,
      );

      const bgColor = interpolateColor(
        x.value,
        [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ],
        [
          NAV_THEME.light.secondary,
          NAV_THEME.light.primary,
          NAV_THEME.light.secondary,
        ],
      );

      return {
        width,
        backgroundColor: bgColor,
      };
    }, [x]);
    return (
      <Animated.View
        className="mx-1 h-2 w-6 rounded-full"
        style={[itemRnStyle]}
      />
    );
  }, []);

  return (
    <View className="flex flex-row items-center justify-center">
      {Array.from({ length }).map((_, index) => {
        return <PaginationComponent index={index} key={index} />;
      })}
    </View>
  );
};
