import { useEffect, useState } from "react";
import { Dimensions, SafeAreaView, TouchableOpacity, View } from "react-native";
import { PanGestureHandler, ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import type { Stats, Subject } from "~/types/types";
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
import { formatStatsObject, letterToGpa } from "~/lib/utils";
import { api } from "~/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

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
      translateX.value = withSpring(-currentPage.value * SCREEN_WIDTH, {
        damping: 10,
        stiffness: 120,
      });
    },
  });
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const dotStyle = (index: number) =>
    useAnimatedStyle(() => ({
      opacity: withTiming(currentPage.value === index ? 1 : 0.3, {
        duration: 300,
      }),
    }));

  useEffect(() => {
    if (stats) return;

    void (async () => {
      const currentStats = await getStats();
      const grades = await getGrades();

      setStats(currentStats);
      setOverall(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        Object.values(currentStats!).reduce((acc, value) => acc + value, 0) /
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          Object.keys(currentStats!).length,
      );
      setGrades(grades);
      setGpa(
        grades.reduce((acc, grade) => acc + letterToGpa(grade.grade), 0) /
          grades.length,
      );
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: "Dashboard",
          header: () => <></>,
        }}
      />
      <View className="mx-4 mt-8 flex-1 rounded-xl bg-foreground">
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
          <TouchableOpacity className="mb-5 flex-row items-center justify-center">
            <SymbolView
              name="square.and.arrow.up"
              resizeMode="scaleAspectFit"
              scale="small"
              weight="medium"
              tintColor="black"
            />
            <Text className="ml-2 text-lg font-medium text-secondary-foreground">
              Share my report
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <View className="mb-8 mt-4 flex items-center">
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
            // if (!storedPotentialStats && stats) {
            console.log(grades);
            const potentialStats = await generatePotentialStats.mutateAsync({
              questions: [...(await getHabits()), ...(await getFocus())],
              currentStats: stats,
              grades,
            });
            await setPotentialGrades(potentialStats.grades);
            delete potentialStats.grades;
            await setPotentialStats(potentialStats);
            // }
            router.replace("/stats/potential");
          } catch (error) {
            console.error("Failed to generate potential stats:", error);
          }
        }}
      >
        <Text className="text-center text-lg font-semibold text-primary-foreground">
          See your potential
        </Text>
      </Button>
    </SafeAreaView>
  );
}
