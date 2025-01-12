import { useEffect, useState } from "react";
import { Dimensions, SafeAreaView, View } from "react-native";
import { PanGestureHandler, ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";

import type { Stats, Subject } from "~/types/types";
import { ShareReport } from "~/components/share-report";
import { StatsPage } from "~/components/stats-page";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  getGrades,
  getPotentialGrades,
  getPotentialStats,
  getStats,
} from "~/lib/storage";
import { calculateOverall, formatStatsObject, letterToGpa } from "~/lib/utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.1;

export default function Potential() {
  const router = useRouter();
  const currentPage = useSharedValue(0);
  const translateX = useSharedValue(-currentPage.value * SCREEN_WIDTH);
  const [potentialOverall, setPotentialOverall] = useState(0);
  const [potentialGpa, setPotentialGpa] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [potentialStats, setPotentialStats] = useState<Stats | null>(null);
  const [grades, setGrades] = useState<Subject[]>([]);
  const [potentialGrades, setPotentialGrades] = useState<Subject[]>([]);

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        if (event.translationX > 0 && currentPage.value > 0) {
          currentPage.value -= 1;
        } else if (event.translationX < 0 && currentPage.value < 1) {
          currentPage.value += 1;
        }
      }
      translateX.value = withSpring(-currentPage.value * SCREEN_WIDTH);
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const firstDotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(currentPage.value === 0 ? 1 : 0.3, {
      duration: 300,
    }),
  }));

  const secondDotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(currentPage.value === 1 ? 1 : 0.3, {
      duration: 300,
    }),
  }));

  useEffect(() => {
    if (stats || potentialStats) return;

    void (async () => {
      const stats = await getStats();
      const grades = await getGrades();
      const potentialStats = await getPotentialStats();
      const potentialGrades = await getPotentialGrades();
      setStats(stats);
      setGrades(grades);
      setPotentialStats(potentialStats);
      setPotentialGrades(potentialGrades);
      setPotentialOverall(calculateOverall(potentialStats!));
      setPotentialGpa(
        potentialGrades.reduce(
          (acc, grade) => acc + letterToGpa(grade.grade),
          0,
        ) / potentialGrades.length,
      );
    })();
  }, [potentialStats, stats]);

  if (!stats || !potentialStats)
    return <Stack.Screen options={{ headerShown: false }} />;

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mx-4 mt-4 flex-1 rounded-xl bg-foreground">
        <ScrollView className="flex-1">
          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View
              className="flex flex-row justify-between px-5"
              style={[
                {
                  width: 2 * SCREEN_WIDTH,
                },
                animatedStyle,
              ]}
            >
              <StatsPage
                heading="Potential Stats"
                overall={potentialOverall / 100}
                overallLabel={`${potentialOverall.toFixed(0)}%`}
                stats={formatStatsObject(stats, potentialStats)}
              />
              <StatsPage
                heading="Potential Grades"
                overall={potentialGpa / 4}
                overallLabel={`${potentialGpa.toFixed(2)} GPA`}
                stats={potentialGrades.map((grade) => ({
                  stat: grade.name,
                  label: grade.grade,
                  value: (letterToGpa(grade.grade) / 4) * 100,
                  improvement: grades.find((g) => g.name === grade.name)?.grade,
                }))}
              />
            </Animated.View>
          </PanGestureHandler>
        </ScrollView>
      </View>
      <View className="my-6 flex items-center">
        <ShareReport className="mb-4" />
        <View className="h-6 w-12 flex-row items-center justify-center rounded-full bg-[#BFBFBF] opacity-[44%]">
          <Animated.View
            className="mx-1 size-2 rounded-full bg-black"
            style={firstDotStyle}
          />
          <Animated.View
            className="mx-1 size-2 rounded-full bg-black"
            style={secondDotStyle}
          />
        </View>
      </View>
      <Button
        size="lg"
        className="mx-8"
        onPress={async () => {
          await StoreReview.requestReview();
          router.replace("/daily");
        }}
      >
        <Text className="text-center text-lg font-semibold text-primary-foreground">
          How can I improve?
        </Text>
      </Button>
    </SafeAreaView>
  );
}
