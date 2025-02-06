import type { ForwardedRef } from "react";
import type {
  EntryAnimationsValues,
  ExitAnimationsValues,
  SharedValue,
} from "react-native-reanimated";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTimer } from "~/lib/use-timer";
import { cn } from "~/lib/utils";
import { Text } from "./ui/text";

const DEFAULT_ANIMATION_DELAY = 0;
const DEFAULT_ANIMATION_DISTANCE = 80;
const DEFAULT_ANIMATION_DURATION = 200;

export interface StopwatchTimerProps {
  animationDuration?: number;
  animationDelay?: number;
  animationDistance?: number;
  containerStyle?: string;
  mode?: "stopwatch" | "timer";
  initialTimeInMs?: number;
  leadingZeros?: 1 | 2;
  enterAnimationType?: "slide-in-up" | "slide-in-down";
  onFinish?: () => void;
  separatorStyle?: string;
  textCharStyle?: string;
  trailingZeros?: 0 | 1 | 2;
  decimalSeparator?: string;
  intervalMs?: number;
  startOnMount?: boolean; // New parameter to start on mount
}

export interface StopwatchTimerMethods {
  play: () => void;
  pause: () => number;
  reset: () => void;
  getSnapshot: () => number;
}

function Stopwatch(
  {
    animationDelay = DEFAULT_ANIMATION_DELAY,
    animationDistance = DEFAULT_ANIMATION_DISTANCE,
    animationDuration = DEFAULT_ANIMATION_DURATION,
    containerStyle,
    enterAnimationType = "slide-in-up",
    mode = "stopwatch",
    initialTimeInMs,
    leadingZeros = 1,
    onFinish,
    separatorStyle,
    textCharStyle,
    trailingZeros = 1,
    decimalSeparator = ",",
    intervalMs = 100,
    startOnMount = false, // Default value for the new parameter
  }: StopwatchTimerProps,
  ref: ForwardedRef<StopwatchTimerMethods>,
) {
  const {
    tensOfMs,
    lastDigit,
    tens,
    minutes,
    play,
    reset,
    pause,
    getSnapshot,
  } = useTimer({
    initialTimeInMs,
    onFinish,
    mode,
    intervalMs,
  });

  useImperativeHandle(ref, () => ({
    play,
    pause,
    reset,
    getSnapshot,
  }));

  useEffect(() => {
    if (startOnMount) {
      play();
    }
  }, [startOnMount, play]);

  const isSecondsDigitMounted = useSharedValue(false);
  const isTensOfSecondsDigitMounted = useSharedValue(false);
  const isMinutesDigitMounted = useSharedValue(false);

  const createEntering =
    (isFirstRender: SharedValue<boolean>) =>
    (values: EntryAnimationsValues) => {
      "worklet";
      if (!isFirstRender.value) {
        isFirstRender.value = true;
        return { initialValues: {}, animations: {} };
      }
      const animations = {
        originY: withDelay(
          animationDelay,
          withTiming(values.targetOriginY, {
            duration: animationDuration,
          }),
        ),
      };
      const enterDirection = enterAnimationType === "slide-in-up" ? -1 : 1;
      const initialValues = {
        originY: values.targetOriginY + animationDistance * enterDirection,
      };
      return {
        initialValues,
        animations,
      };
    };

  const exiting = (values: ExitAnimationsValues) => {
    "worklet";
    const exitDirection = enterAnimationType === "slide-in-up" ? 1 : -1;
    const animations = {
      originY: withDelay(
        animationDelay,
        withTiming(values.currentOriginY + animationDistance * exitDirection, {
          duration: animationDuration,
        }),
      ),
    };
    const initialValues = {
      originY: values.currentOriginY,
    };
    return {
      initialValues,
      animations,
    };
  };

  return (
    <View
      className={cn(
        "-gap-1 flex-row items-center overflow-hidden",
        containerStyle,
      )}
    >
      {leadingZeros === 2 && (
        <Text className={cn("text-center", textCharStyle)}>0</Text>
      )}
      <Animated.Text
        key={`${minutes}-minutes`}
        className={cn("text-center", textCharStyle)}
        entering={createEntering(isMinutesDigitMounted)}
        exiting={exiting}
      >
        {minutes}
      </Animated.Text>
      <Text className={cn("text-center", textCharStyle, separatorStyle)}>
        :
      </Text>
      <Animated.Text
        key={`${tens}-tens`}
        className={cn("text-center", textCharStyle)}
        entering={createEntering(isTensOfSecondsDigitMounted)}
        exiting={exiting}
      >
        {tens}
      </Animated.Text>
      <Animated.Text
        key={`${lastDigit}-count`}
        className={cn("text-center", textCharStyle)}
        entering={createEntering(isSecondsDigitMounted)}
        exiting={exiting}
      >
        {lastDigit}
      </Animated.Text>
      {trailingZeros > 0 && (
        <>
          <Text className={cn("text-center", textCharStyle, separatorStyle)}>
            {decimalSeparator}
          </Text>
          <Text className={cn("text-center", textCharStyle)}>
            {tensOfMs >= 10 ? String(tensOfMs).charAt(0) : 0}
          </Text>
          {trailingZeros === 2 && (
            <Text className={cn("text-center", textCharStyle)}>
              {tensOfMs >= 10
                ? String(tensOfMs).charAt(1)
                : String(tensOfMs).charAt(0)}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

export const StopwatchTimer = forwardRef<
  StopwatchTimerMethods,
  StopwatchTimerProps
>(Stopwatch);
