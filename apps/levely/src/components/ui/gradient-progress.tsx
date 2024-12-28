import * as React from "react";
import { Platform, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as ProgressPrimitive from "@rn-primitives/progress";

import { cn } from "~/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorClassName?: string;
  }
>(({ className, value, indicatorClassName, ...props }, ref) => {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-foreground",
        className,
      )}
      {...props}
    >
      <Indicator value={value} className={indicatorClassName} />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

function Indicator({
  value,
  className,
}: {
  value: number | undefined | null;
  className?: string;
}) {
  const progress = useDerivedValue(() => value ?? 0);

  const indicator = useAnimatedStyle(() => {
    return {
      width: withSpring(
        `${interpolate(progress.value, [0, 100], [1, 100], Extrapolation.CLAMP)}%`,
        { overshootClamping: true },
      ),
    };
  });

  return (
    <ProgressPrimitive.Indicator asChild>
      <Animated.View style={indicator} className={cn("h-full", className)}>
        <LinearGradient
          colors={["#007AFF", "#BD60F4", "#EC447A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </ProgressPrimitive.Indicator>
  );
}
