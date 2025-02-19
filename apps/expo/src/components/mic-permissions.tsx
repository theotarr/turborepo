import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Audio } from "expo-av";

import { Button } from "./ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "./ui/dialog";

export const MicrophonePermission = () => {
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
    <Dialog open={permissionResponse?.granted === false}>
      <DialogPortal>
        <DialogOverlay>
          <Animated.View style={animatedStyle} className="px-8">
            <View className="flex items-center justify-center rounded-2xl bg-secondary px-8 py-6">
              <Text className="text-center text-2xl font-semibold tracking-tight text-secondary-foreground">
                Microphone Access Required
              </Text>
              <Text className="mb-14 mt-2 text-center text-sm font-medium text-muted-foreground">
                We use your mic to record your lectures. If you previously
                denied access, you can change this in your device settings.
              </Text>
              <View className="absolute -bottom-1 left-0 right-0 mt-4 flex-row border-t border-border">
                <Button
                  size="lg"
                  className="relative flex-1 rounded-b-2xl rounded-t-none"
                  onPress={async () => {
                    await requestPermission();
                  }}
                >
                  <Text className="font-medium text-primary-foreground">
                    Allow
                  </Text>
                  <Animated.View
                    style={[
                      bounceStyle,
                      {
                        position: "absolute",
                        bottom: -55,
                        left: "55%",
                      },
                    ]}
                  >
                    <Text className="text-4xl">👆</Text>
                  </Animated.View>
                </Button>
              </View>
            </View>
          </Animated.View>
        </DialogOverlay>
      </DialogPortal>
    </Dialog>
  );
};
