import type { StopwatchTimerMethods } from "react-native-animated-stopwatch-timer";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  TextInput,
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
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { Aperture, ArrowDown } from "lucide-react-native";

import { LectureHeader } from "~/components/lecture-header";
import Stopwatch from "~/components/stopwatch-timer";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { getAudioConfig } from "~/lib/get-audio-recording";
import { useColorScheme } from "~/lib/theme";
import { useKeyboardVisible } from "~/lib/use-keyboard-visible";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

export default function Record() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isKeyboardVisible = useKeyboardVisible();
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("Lecture ID is required");
  const { data: user } = api.auth.getUser.useQuery();
  const { data: lecture } = api.lecture.byId.useQuery({ id });

  const transcribeAudio = api.lecture.liveMobile.useMutation();

  const [notes, setNotes] = useState("");
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      if (permissionResponse?.status !== "granted") {
        console.log("Requesting permission...");
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

    setIsRecording(false);
    setIsTranscribing(true);
    stopwatchTimerRef.current?.pause();

    try {
      await recording?.stopAndUnloadAsync();
      const recordingUri = recording?.getURI();
      if (!recordingUri) throw new Error("No recording URI");

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
      console.error(e);
    }
  }

  if (!lecture) return <Stack.Screen options={{ headerShown: false }} />;

  return (
    <SafeAreaView className="my-0 py-0">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex h-full flex-col justify-between bg-background">
        <View className="flex-1 p-4">
          <LectureHeader
            showBackButton={false}
            lecture={
              lecture as {
                id: string;
                title: string;
                type: "YOUTUBE" | "AUDIO" | "LIVE";
                createdAt: Date;
              }
            }
            courses={user?.courses ?? []}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="mx-2 mt-6 flex-1"
            keyboardVerticalOffset={120}
          >
            <TextInput
              className="h-full w-full bg-background p-4 text-xl text-foreground"
              multiline
              placeholder="Jot down anything that stands out, and we'll enhance it..."
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
            {isKeyboardVisible && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                className="items-end justify-end"
              >
                <TouchableOpacity
                  className="mt-2 rounded-full bg-muted p-2.5"
                  onPress={() => Keyboard.dismiss()}
                >
                  <ArrowDown
                    size={24}
                    color={NAV_THEME[colorScheme].secondaryForeground}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}
          </KeyboardAvoidingView>
        </View>
        <View className="mb-4 w-full flex-row items-center justify-center">
          <View className="flex-row items-center justify-center gap-x-2 rounded-full bg-muted p-3.5">
            <Aperture
              size={28}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text className="text-2xl font-bold tracking-tighter">
              KnowNotes
            </Text>
          </View>
        </View>
        <View className="-mb-10 flex h-80 items-center justify-center bg-muted pb-12 pt-6">
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
              className="w-56 flex-row items-center gap-x-2 rounded-full"
              size="lg"
              onPress={transcribeRecording}
              disabled={!recording || isTranscribing}
            >
              {isTranscribing && (
                <ActivityIndicator size="small" color="white" />
              )}
              <Text>Generate Notes</Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
