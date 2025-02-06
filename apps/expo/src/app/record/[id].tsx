import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
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

import type { StopwatchTimerMethods } from "~/components/stopwatch-timer";
import { LectureOperations } from "~/components/lecture-operations";
import { StopwatchTimer } from "~/components/stopwatch-timer";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetView,
  RemoteControlSheet,
} from "~/components/ui/bottom-sheet";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { getAudioConfig } from "~/lib/get-audio-recording";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

const recording = new Audio.Recording();
const PAUSE_SHEET_TIMEOUT = 15000; // 15 seconds

export default function Record() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("Lecture ID is required");

  const { data: user } = api.auth.getUser.useQuery();
  const { data: lecture } = api.lecture.byId.useQuery({ id });
  const transcribeAudio = api.lecture.liveMobile.useMutation();

  const [isRecording, setIsRecording] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPauseSheet, setShowPauseSheet] = useState(false);
  const [isInterruption, setIsInterruption] = useState(false);
  const [interruption, setInterruption] = useState<{
    startTime: number;
    endTime: number | null;
  } | null>(null);

  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const metering = useSharedValue(-100);

  const stopwatchTimerRef = useRef<StopwatchTimerMethods>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();
  const isRecordingRef = useRef(false);
  const interruptionRef = useRef<{
    startTime: number;
    endTime: number | null;
    isActive: boolean;
  }>({
    startTime: 0,
    endTime: null,
    isActive: false,
  });
  const startTimeRef = useRef<number | null>(null);

  const animatedMic = useAnimatedStyle(() => ({
    width: withTiming(isRecording ? "60%" : "90%"),
    borderRadius: withTiming(isRecording ? 10 : 50),
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

  // Setup audio mode once when component mounts
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (permissionResponse?.status === "granted") return;

    async function setupRecording() {
      try {
        console.log("[Record] Requesting permission...");
        await requestPermission();

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });

        await recording.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
      } catch (err) {
        console.error("Failed to setup audio", err);
      }
    }
    void setupRecording()
      .then(() => {
        void startRecording();
      })
      .catch((err) => {
        console.error("Failed to setup audio", err);
        setIsRecording(false);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (permissionResponse?.status !== "granted") {
      console.log("[Record] Requesting permission...");
      await requestPermission();
    }

    try {
      console.log("Starting recording...");

      // Set the recording status update here to prevent this running before the recording is ready.
      recording.setOnRecordingStatusUpdate((status) => {
        metering.value = status.metering ?? -160; // Update the metering animation value.

        // Use ref instead of state to get latest value.
        if (
          status.isRecording === false &&
          isRecordingRef.current &&
          startTimeRef.current &&
          new Date().getTime() - startTimeRef.current > 1000 // Recording for at least one second.
        ) {
          console.log("[Record] Interruption detected");

          // Pause the recording and log the interruption time.
          void pauseRecording(false);
          setIsInterruption(true);
          setInterruption({
            startTime: new Date().getTime(),
            endTime: null,
          });
        }
      });

      await recording.startAsync();
      if (!startTimeRef.current) startTimeRef.current = new Date().getTime();
      setIsRecording(true);
      stopwatchTimerRef.current?.play(); // This doesn't do anything on initial useEffect runs, since the stopwatch won't be mounted yet.
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function pauseRecording(showPauseSheet = true) {
    try {
      console.log("Pausing recording...");
      stopwatchTimerRef.current?.pause();
      setIsRecording(false);
      setShowPauseSheet(false);
      await recording.pauseAsync();

      if (showPauseSheet) {
        // Start a timer to show pause dialog.
        pauseTimeoutRef.current = setTimeout(() => {
          console.log("[Record] Showing pause sheet");
          // Open the bottom sheet and give haptic notifiction feedback.
          setShowPauseSheet(true);
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
        }, PAUSE_SHEET_TIMEOUT);
      }
    } catch (err) {
      console.error("Failed to pause recording", err);
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
      await recording.stopAndUnloadAsync();
      const recordingUri = recording.getURI();
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

  // Update refs whenever state changes.
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    interruptionRef.current = {
      startTime: interruption?.startTime ?? 0,
      endTime: interruption?.endTime ?? null,
      isActive: isInterruption,
    };
  }, [interruption, isInterruption]);

  // Handle app state changes.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      console.log("App state changed to:", nextAppState);

      if (nextAppState === "active") {
        // App is now in the foreground.
        if (interruptionRef.current.isActive && !isRecordingRef.current) {
          // There was an interruption that has not been resumed.
          setInterruption(null); // Trigger this to update the prop to trigger the bottom sheet.
          setInterruption((prev) => ({
            startTime: prev?.startTime ?? new Date().getTime(),
            endTime: new Date().getTime(),
          }));
          void startRecording();
        }
      }
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup the pause timeout and recording on unmount
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
      <View className="flex h-full flex-col items-center bg-background">
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
        <View className="px-6 py-4">
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
        <View className="flex h-[85%] items-center justify-center">
          <Text className="mb-2 text-center text-[1.75rem] font-semibold tracking-tight text-secondary-foreground">
            {isRecording ? "Tap to stop recording" : "Recording paused"}
          </Text>
          <Text className="m-1 mb-8 text-center text-3xl font-medium text-secondary-foreground">
            <StopwatchTimer
              startOnMount={isRecording}
              ref={stopwatchTimerRef}
              leadingZeros={2}
              trailingZeros={0}
              textCharStyle="-m-[1.2px] font-bold text-secondary-foreground/80 tabular-nums text-[1.8rem] font-mono"
            />
          </Text>
          <Pressable
            onPress={async () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (isRecording) await pauseRecording();
              else await startRecording();
            }}
            className="relative flex size-[8rem] items-center justify-center rounded-full border-4 border-border"
          >
            <Animated.View
              style={[animatedMic]}
              className={cn(
                "aspect-square w-[90%] rounded-full bg-primary/80",
                isRecording && "w-[70%]",
              )}
            />
            <Animated.View
              style={[animatedRecordWave]}
              className="absolute -z-10 rounded-full bg-primary/40"
            />
          </Pressable>
        </View>
        <View className="absolute bottom-0 w-full items-center">
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
        </View>
        <BottomSheet>
          <RemoteControlSheet open={showPauseSheet} />
          <BottomSheetContent onDismiss={() => setShowPauseSheet(false)}>
            <BottomSheetView className="my-6 px-6">
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
        <BottomSheet>
          <RemoteControlSheet open={isInterruption} />
          <BottomSheetContent
            onDismiss={() => {
              setInterruption(null);
              setIsInterruption(false);
            }}
          >
            <BottomSheetView className="my-6 px-6">
              <Text className="text-2xl font-semibold text-secondary-foreground">
                {interruption?.endTime
                  ? `Interruption from ${new Date(interruption.startTime).toLocaleTimeString([], { hour: "numeric", minute: "numeric" })} to ${new Date(interruption.endTime).toLocaleTimeString([], { hour: "numeric", minute: "numeric" })}`
                  : "Recording was interrupted"}
              </Text>
              <Text className="mt-2 text-muted-foreground">
                {interruption?.endTime ? (
                  <>
                    Another app used your microphone. We automatically resumed
                    recording after the interruption ended.
                  </>
                ) : (
                  <>
                    Another app is using your microphone. Recording is
                    unavailable until the interruption ends.
                  </>
                )}
              </Text>
              <TouchableOpacity
                className="mx-auto mt-4 flex-row items-center gap-x-2"
                onPress={() => {
                  setIsInterruption(false);
                  setInterruption(null);
                }}
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
