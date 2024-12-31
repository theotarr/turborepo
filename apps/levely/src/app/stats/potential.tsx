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

import type { Stats } from "~/types/types";
import { StatsPage } from "~/components/stats-page";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { getPotentialStats, getStats } from "~/lib/storage";
import { formatStatsObject } from "~/lib/utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function Potential() {
  const router = useRouter();
  const currentPage = useSharedValue(0);
  const translateX = useSharedValue(-currentPage.value * SCREEN_WIDTH);
  const [stats, setStats] = useState<Stats | null>(null);
  const [potentialStats, setPotentialStats] = useState<Stats | null>(null);
  const [potentialGrades, setPotentialGrades] = useState<null>(null);

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

    async function setState() {
      const stats = await getStats();
      const potentialStats = await getPotentialStats();
      // const potentialGrades = await getPotentialGrades();
      setStats(stats);
      setPotentialStats(potentialStats);
      // setPotentialGrades(potentialGrades);
    }
    setState();
  }, []);

  if (!stats || !potentialStats) return null;
  console.log("potential", formatStatsObject(stats, potentialStats));

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
                heading="Potential Stats"
                overall={0.95}
                overallLabel="95%"
                stats={formatStatsObject(stats, potentialStats)}
              />
              <StatsPage
                heading="Potential Grades"
                overall={0.85}
                overallLabel="85%"
                stats={[
                  {
                    stat: "Math",
                    label: "A-",
                    value: 90,
                    improvement: "B+",
                  },
                  {
                    stat: "Science",
                    label: "A",
                    value: 93,
                    improvement: "B+",
                  },
                  {
                    stat: "English",
                    label: "B",
                    value: 85,
                    improvement: "C+",
                  },
                  {
                    stat: "History",
                    label: "B-",
                    value: 80,
                    improvement: "C",
                  },
                  {
                    stat: "Art",
                    label: "A+",
                    value: 97,
                    improvement: "A",
                  },
                  {
                    stat: "Latin",
                    label: "C",
                    value: 75,
                    improvement: "D+",
                  },
                ]}
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
        onPress={() => {
          router.replace("/dashboard");
        }}
      >
        <Text className="text-center text-lg font-semibold text-primary-foreground">
          How can I improve?
        </Text>
      </Button>
    </SafeAreaView>
  );
}
