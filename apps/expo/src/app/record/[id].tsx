import type { StopwatchTimerMethods } from "react-native-animated-stopwatch-timer";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { Aperture, ChevronLeft } from "lucide-react-native";

import Stopwatch from "~/components/stopwatch-timer";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { getAudioConfig } from "~/lib/get-audio-recording";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

export default function Record() {
  const router = useRouter();
  const { id } = useGlobalSearchParams();
  const { colorScheme } = useColorScheme();
  if (!id || typeof id !== "string") throw new Error("Lecture ID is required");
  const { data: lecture } = api.lecture.byId.useQuery({ id });
  const liveMobileMutation = api.lecture.liveMobile.useMutation();

  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const metering = useSharedValue(-100);
  const stopwatchTimerRef = useRef<StopwatchTimerMethods>(null);

  const animatedMic = useAnimatedStyle(() => ({
    width: withTiming(isRecording ? "60%" : "100%"),
    borderRadius: withTiming(isRecording ? 5 : 35),
  }));

  const animatedRecordWave = useAnimatedStyle(() => {
    const interpolated = interpolate(
      metering.value,
      [-160, -50, -20],
      [0, 110, 200],
    );

    return {
      width: withSpring(`${interpolated}%`),
      height: withSpring(`${interpolated}%`),
    };
  });

  async function startRecording() {
    setIsRecording(true);

    // If we already have a recording, resume it.
    if (recording) {
      await recording.startAsync();
      stopwatchTimerRef.current?.play();
      return;
    }

    try {
      if (permissionResponse?.status !== "granted") {
        console.log("Requesting permission...");
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      stopwatchTimerRef.current?.play();
      console.log("Recording started");

      recording.setOnRecordingStatusUpdate((status) => {
        metering.value = status.metering ?? -100;
      });
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function pauseRecording() {
    console.log("Pausing recording...");
    setIsRecording(false);
    stopwatchTimerRef.current?.pause();

    try {
      await recording?.pauseAsync();
    } catch (e) {
      console.error(e);
    }
  }

  async function transcribeRecording() {
    if (!lecture) return;

    console.log("Stopping recording...");
    setIsRecording(false);
    setIsTranscribing(true);
    stopwatchTimerRef.current?.pause();

    try {
      await recording?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const recordingUri = recording?.getURI()!;
      const uri = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const audioConfig = getAudioConfig();

      await liveMobileMutation.mutateAsync({
        lectureId: lecture.id,
        audioUrl: uri,
        config: audioConfig,
      });

      // Redirect to the lecture notes page.
      router.replace(`/lecture/${lecture.id}`);
    } catch (e) {
      console.error(e);
    }
  }

  if (!lecture) return null;

  return (
    <SafeAreaView className="my-0 bg-muted py-0">
      <Stack.Screen
        options={{
          title: "Live Lecture",
          headerLeft: () => (
            <Button
              variant="ghost"
              onPress={() => {
                router.replace("/(dashboard)/dashboard");
              }}
            >
              <ChevronLeft
                color={NAV_THEME[colorScheme].secondaryForeground}
                size={16}
              />
            </Button>
          ),
        }}
      />
      {/* <GlowingWaves /> */}
      <View className="flex h-full flex-col justify-between bg-background">
        <View className="mx-auto mt-8 flex flex-row items-center rounded-full bg-foreground px-5 py-3">
          <Aperture color={NAV_THEME[colorScheme].background} size={26} />
          <Text className="ml-2.5 text-2xl font-bold tracking-tighter text-secondary">
            KnowNotes.ai
          </Text>
        </View>
        <View className="flex h-72 items-center justify-center bg-muted py-4">
          <Text className="mb-2 text-center text-2xl font-semibold text-secondary-foreground">
            {isRecording
              ? "Recording your lecture"
              : "Press to start recording"}
          </Text>
          <Text className="m-1 mb-4 text-center text-3xl font-medium text-secondary-foreground">
            <Stopwatch
              ref={stopwatchTimerRef}
              leadingZeros={2}
              trailingZeros={0}
              textCharStyle="-m-[1px] font-bold text-secondary-foreground/80 tabular-nums text-2xl font-mono"
            />
          </Text>
          <Pressable
            onPress={isRecording ? pauseRecording : startRecording}
            className="relative flex size-[4.5rem] items-center justify-center rounded-full border-4 border-border"
          >
            <Animated.View
              style={[animatedMic]}
              className={cn(
                "aspect-square w-[90%] rounded-full bg-primary",
                isRecording && "w-[70%]",
              )}
            />
            <Animated.View
              style={[animatedRecordWave]}
              className="absolute -z-10 rounded-full bg-primary/40"
            />
          </Pressable>
          <View className="mt-6">
            <Button
              className="w-56 rounded-full"
              size="lg"
              onPress={transcribeRecording}
              disabled={!recording || isTranscribing}
            >
              <Text>Generate Notes</Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
