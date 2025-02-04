import type { StopwatchTimerMethods } from "react-native-animated-stopwatch-timer";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { Aperture, ChevronDown } from "lucide-react-native";

import { LectureOperations } from "~/components/lecture-operations";
import Stopwatch from "~/components/stopwatch-timer";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetView,
  PauseSheet,
} from "~/components/ui/bottom-sheet";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { getAudioConfig } from "~/lib/get-audio-recording";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

export default function Record() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("Lecture ID is required");
  const { data: user } = api.auth.getUser.useQuery();
  const { data: lecture } = api.lecture.byId.useQuery({ id });

  const transcribeAudio = api.lecture.liveMobile.useMutation();

  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPauseSheet, setShowPauseSheet] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const metering = useSharedValue(-100);
  const stopwatchTimerRef = useRef<StopwatchTimerMethods>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();

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
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    setShowPauseSheet(false);

    // If we already have a recording, resume it.
    if (recording) {
      await recording.startAsync();
      stopwatchTimerRef.current?.play();
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (permissionResponse?.status !== "granted") {
        console.log("[Record] Requesting permission...");
        await requestPermission();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });

      console.log("[Record] Starting recording...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      stopwatchTimerRef.current?.play();
      console.log("[Record] Recording started");

      recording.setOnRecordingStatusUpdate((status) => {
        metering.value = status.metering ?? -100;
      });
    } catch (err) {
      console.error("[Record] Failed to start recording", err);
    }
  }

  async function pauseRecording() {
    console.log("[Record] Pausing recording...");
    setIsRecording(false);
    stopwatchTimerRef.current?.pause();

    try {
      await recording?.pauseAsync();
      // Start 15 second timer to show end dialog
      pauseTimeoutRef.current = setTimeout(() => {
        console.log("[Record] Showing pause sheet");
        // Open the bottom sheet and give haptic notifiction feedback.
        setShowPauseSheet(true);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      }, 1000);
    } catch (e) {
      console.error(e);
    }
  }

  async function transcribeRecording() {
    if (!lecture) return;

    setIsRecording(false);
    setIsTranscribing(true);
    stopwatchTimerRef.current?.pause();
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }

    try {
      await recording?.stopAndUnloadAsync();
      const recordingUri = recording?.getURI();
      if (!recordingUri) throw new Error("[Record] No recording URI");

      const audioUrl = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const config = getAudioConfig();

      await transcribeAudio.mutateAsync({
        lectureId: lecture.id,
        audioUrl,
        config,
      });

      // Redirect to the lecture notes page.
      router.replace(`/lecture/${lecture.id}`);
    } catch (e) {
      console.error("[Record] Failed to transcribe recording", e);
    }
  }

  useEffect(() => {
    if (isRecording) return;
    // Set the state to prevent a race condition where a second recording starts before state is set.
    setIsRecording(true);
    void startRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  if (!lecture) return <Stack.Screen options={{ headerShown: false }} />;

  return (
    <SafeAreaView className="my-0 py-0">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full flex-col justify-between bg-background">
        <View className="flex-1 px-6 py-4">
          <View className="flex-row items-center justify-center">
            <View className="flex-row items-center gap-x-2">
              <Aperture
                size={24}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
              <Text className="text-xl font-bold tracking-tighter">
                KnowNotes
              </Text>
            </View>
          </View>
        </View>
        <View className="absolute right-3 top-3">
          <LectureOperations
            lecture={{
              id: lecture.id,
              title: lecture.title,
              courseId: lecture.courseId ?? undefined,
            }}
            courses={user?.courses ?? []}
          />
        </View>
        <View className="-mb-10 flex h-80 items-center justify-center bg-muted pb-12 pt-6">
          <Text className="mb-2 text-center text-2xl font-semibold text-secondary-foreground">
            {isRecording ? "Tap to stop recording" : "Recording paused"}
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
            onPress={async () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (isRecording) await pauseRecording();
              else await startRecording();
            }}
            className="relative flex size-[5rem] items-center justify-center rounded-full border-4 border-border"
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
          <View className="flex w-full items-center">
            {recording && (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Button
                  className="mt-6 w-96 rounded-full"
                  size="lg"
                  onPress={transcribeRecording}
                  disabled={isTranscribing}
                >
                  <View className="flex-row items-center gap-x-2">
                    {isTranscribing && (
                      <ActivityIndicator size="small" color="white" />
                    )}
                    <Text>Transcribe & Summarize</Text>
                  </View>
                </Button>
              </Animated.View>
            )}
          </View>
        </View>
        <BottomSheet>
          <PauseSheet open={showPauseSheet} />
          <BottomSheetContent>
            <BottomSheetView className="mt-4 px-6">
              <Text className="text-2xl font-semibold text-secondary-foreground">
                Recording is paused. End it?
              </Text>
              <Text className="mt-2 text-muted-foreground">
                Your recording is paused but hasn't been saved yet. Tap
                'Transcribe & Summarize' when you're finished to create notes.
              </Text>
              <TouchableOpacity
                className="mx-auto mt-4 flex-row items-center gap-x-2"
                onPress={() => setShowPauseSheet(false)}
              >
                <ChevronDown size={16} color={NAV_THEME[colorScheme].primary} />
                <Text className="text-primary">Dismiss</Text>
              </TouchableOpacity>
            </BottomSheetView>
          </BottomSheetContent>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}
