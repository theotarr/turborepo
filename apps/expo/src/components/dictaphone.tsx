import React, { useEffect } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

import { Button } from "./ui/button";

const Dictaphone = () => {
  const metering = useSharedValue(-100);

  const animatedMic = useAnimatedStyle(() => ({
    width: withSpring("60%"),
    borderRadius: withSpring(10),
  }));

  const animatedRecordWave = useAnimatedStyle(() => {
    const interpolated = interpolate(
      metering.value,
      [-160, -50, -20],
      [0, 100, 200],
    );

    return {
      width: withSpring(`${interpolated}%`),
      height: withSpring(`${interpolated}%`),
    };
  });

  useEffect(() => {
    const pulse = () => {
      metering.value = withRepeat(
        withSequence(
          withTiming(-25, { duration: 1250 }),
          withTiming(-75, { duration: 1250 }),
        ),
        -1,
        true,
      );
    };
    pulse();
  }, [metering]);

  return (
    <View className="flex-1 items-center justify-center">
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        className="relative mt-12 flex size-[9rem] items-center justify-center rounded-full border-4 border-border"
      >
        <Animated.View
          style={[animatedMic]}
          className="aspect-square w-[90%] rounded-full bg-primary/80"
        />
        <Animated.View
          style={[animatedRecordWave]}
          className="absolute -z-10 rounded-full bg-primary/40"
        />
      </Pressable>
      <Text className="mt-12 text-center text-lg text-muted-foreground">
        "Next" to continue
      </Text>
    </View>
  );
};

export const OnboardingDictaphone = () => {
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const fadeAnim = useSharedValue(0);
  const bounceAnimation = useSharedValue(0);

  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: bounceAnimation.value,
        },
      ],
    };
  });

  useEffect(() => {
    bounceAnimation.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 750 }),
        withTiming(0, { duration: 750 }),
      ),
      -1,
      true,
    );
  }, [bounceAnimation]);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 750 });
  }, [fadeAnim, permissionResponse]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {permissionResponse?.granted ? (
        <Dictaphone />
      ) : (
        <View className="flex items-center justify-center rounded-2xl bg-secondary px-8 py-6">
          <Text className="mb-14 text-center text-2xl font-semibold text-secondary-foreground">
            KnowNotes would like to access your microphone
          </Text>
          <View className="absolute bottom-0 left-0 right-0 mt-4 flex-row border-t border-border">
            <Button
              size="lg"
              className="flex-1 rounded-b-none rounded-t-none rounded-bl-2xl"
              variant="secondary"
              onPress={() => {
                Alert.alert(
                  "Microphone Permission",
                  "This app requires access to your microphone to record audio. Please enable microphone access in your settings.",
                  [{ text: "OK" }],
                );
              }}
            >
              <Text className="font-medium text-secondary-foreground">
                Don't Allow
              </Text>
            </Button>
            <Button
              size="lg"
              className="relative flex-1 rounded-b-none rounded-t-none rounded-br-2xl"
              onPress={async () => {
                await requestPermission();
              }}
            >
              <Text className="font-medium text-primary-foreground">Allow</Text>
              <Animated.View
                style={[
                  bounceStyle,
                  {
                    position: "absolute",
                    bottom: -55,
                    left: "50%",
                  },
                ]}
              >
                <Text className="text-4xl">👆</Text>
              </Animated.View>
            </Button>
          </View>
        </View>
      )}
    </Animated.View>
  );
};
