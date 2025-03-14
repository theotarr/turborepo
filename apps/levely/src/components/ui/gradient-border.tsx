import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient, LinearGradientProps } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

export type GradientProps = Omit<
  LinearGradientProps,
  "style" | "pointerEvents"
>;

export type RequiredGradientBorderProps = {
  /**
   * Props to be passed to the gradient component. See `react-native-linear-gradient` for full list. Requires "colors" prop.
   */
  gradientProps: GradientProps;
};

type BorderProps = {
  /**
   * Width of border.
   */
  borderWidth?: number;

  /**
   * Border applied to top of view, overrides borderWidth.
   */
  borderTopWidth?: number;
  /**
   * Border applied to left side of view, overrides borderWidth.
   */
  borderLeftWidth?: number;

  /**
   * Border applied to bottom side of view, overrides borderWidth.
   */
  borderBottomWidth?: number;

  /**
   * Border appled to right side of view, overrides borderWidth.
   */
  borderRightWidth?: number;
  /**
   * Border radius applied to each corner.
   */
  borderRadius?: number;
  /**
   * Border radius applied to top right corner, Overrides borderRadius.
   */
  borderTopRightRadius?: number;
  /**
   * Border radius applied to top left corner. Overrides borderRadius
   */
  borderTopLeftRadius?: number;
  /**
   * Border radius applied to bottom right corner. Overrides borderRadius
   */
  borderBottomRightRadius?: number;
  /**
   * Border radius applied to bottom left corner. Overrides borderRadius
   */
  borderBottomLeftRadius?: number;
};

/**
 * A component that applies a gradient border to the parent.
 * Should be placed as the last child of the parent so that it isn't overlapped.
 * @example
 * ```tsx
 *      <View>
 *          <GradientBorder
 *              borderWidth={2}
 *              gradientProps={{
 *                  colors: ['red', 'blue']
 *              }}
 *          />
 *      </View>
 * ```
 */
export default function GradientBorder({
  gradientProps,
  borderWidth = 2,
  borderRadius,
  borderTopRightRadius,
  borderTopLeftRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  borderTopWidth,
  borderLeftWidth,
  borderRightWidth,
  borderBottomWidth,
}: RequiredGradientBorderProps & BorderProps) {
  const animatedBorderWidth = useSharedValue(borderWidth);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderWidth: animatedBorderWidth.value,
    };
  });

  React.useEffect(() => {
    animatedBorderWidth.value =
      withSpring(borderWidth, { stiffness: 100 }) ?? 0;
  }, [borderWidth]);

  return (
    <MaskedView
      maskElement={
        <Animated.View
          pointerEvents="none"
          style={[
            {
              borderRadius,
              borderTopLeftRadius,
              borderTopRightRadius,
              borderBottomLeftRadius,
              borderBottomRightRadius,
              borderTopWidth,
              borderLeftWidth,
              borderRightWidth,
              borderBottomWidth,
            },
            animatedStyle,
            StyleSheet.absoluteFill,
          ]}
          collapsable={false}
        />
      }
      style={[StyleSheet.absoluteFill]}
      pointerEvents="none"
    >
      <LinearGradient
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        {...gradientProps}
      />
    </MaskedView>
  );
}
