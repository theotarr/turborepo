import { useEffect, useState } from "react";
import { Dimensions, ImageBackground, SafeAreaView, View } from "react-native";
import { PanGestureHandler, ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";

import type { Stats, Subject } from "~/types/types";
import { ShareReport } from "~/components/share-report";
import { StatsPage } from "~/components/stats-page";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  getFocus,
  getGrades,
  getHabits,
  getPotentialStats,
  getStats,
  setPotentialGrades,
  setPotentialStats,
} from "~/lib/storage";
import { calculateOverall, formatStatsObject, letterToGpa } from "~/lib/utils";
import { api } from "~/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.1;

export default function Current() {
  const router = useRouter();
  const generatePotentialStats =
    api.levely.generatePotentialStatsAndGrades.useMutation();

  const [stats, setStats] = useState<Stats | null>(null);
  const [overall, setOverall] = useState(0);
  const [grades, setGrades] = useState<Subject[]>([]);
  const [gpa, setGpa] = useState(0);
  const currentPage = useSharedValue(0);
  const translateX = useSharedValue(-currentPage.value * SCREEN_WIDTH);

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  const dotStyle = (index: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: withTiming(currentPage.value === index ? 1 : 0.3, {
        duration: 300,
      }),
    }));

  useEffect(() => {
    if (stats) return;

    void (async () => {
      const currentStats = await getStats();
      if (!currentStats) return;
      setStats(currentStats);
      setOverall(calculateOverall(currentStats));

      const grades = await getGrades();
      setGrades(grades);
      setGpa(
        grades.reduce((acc, grade) => acc + letterToGpa(grade.grade), 0) /
          grades.length,
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ImageBackground
      source={require("~/../assets/background.png")}
      className="flex-1"
    >
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
                  heading="Overall Stats"
                  overall={overall / 100}
                  overallLabel={`${overall.toFixed(0)}%`}
                  stats={stats ? formatStatsObject(stats) : []}
                />
                <StatsPage
                  heading="Grades"
                  overall={gpa / 4}
                  overallLabel={`${gpa.toFixed(2)} GPA`}
                  stats={grades.map((grade) => ({
                    stat: grade.name,
                    label: grade.grade,
                    value: (letterToGpa(grade.grade) / 4) * 100,
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
              style={dotStyle(0)}
            />
            <Animated.View
              className="mx-1 size-2 rounded-full bg-black"
              style={dotStyle(1)}
            />
          </View>
        </View>
        <Button
          size="lg"
          className="mx-8"
          onPress={async () => {
            try {
              const storedPotentialStats = await getPotentialStats();
              if (!storedPotentialStats && stats) {
                const potentialStats = await generatePotentialStats.mutateAsync(
                  {
                    questions: [...(await getHabits()), ...(await getFocus())],
                    currentStats: stats,
                    grades,
                  },
                );
                // @ts-expect-error - id: string is missing from the type
                await setPotentialGrades(potentialStats.grades);
                // @ts-expect-error - TODO: Fix this
                delete potentialStats.grades;
                await setPotentialStats(potentialStats);
              }
              router.replace("/stats/potential");
            } catch (error) {
              console.error("Failed to generate potential stats:", error);
            }
          }}
          disabled={generatePotentialStats.isPending}
        >
          <Text className="text-center text-lg font-semibold text-primary-foreground">
            See your potential
          </Text>
        </Button>
      </SafeAreaView>
    </ImageBackground>
  );
}
