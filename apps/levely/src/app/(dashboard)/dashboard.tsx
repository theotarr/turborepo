import { useEffect, useState } from "react";
import { Dimensions, SafeAreaView, TouchableOpacity } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Stack } from "expo-router";
import { SymbolView } from "expo-symbols";

import type { Stats } from "~/types/types";
import { DashboardStatsPage } from "~/components/stats-page";
import { Text } from "~/components/ui/text";
import { getPotentialStats, getStats } from "~/lib/storage";
import { calculateOverall, formatStatsObject } from "~/lib/utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [potentialStats, setPotentialStats] = useState<Stats | null>(null);
  const [overall, setOverall] = useState(0);
  const [potentialOverall, setPotentialOverall] = useState(0);

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

  useEffect(() => {
    void (async () => {
      const currentStats = await getStats();
      if (!currentStats) return;
      setStats(currentStats);
      setOverall(calculateOverall(currentStats));

      const potentialStats = await getPotentialStats();
      if (!potentialStats) return;
      setPotentialStats(potentialStats);
      setPotentialOverall(calculateOverall(potentialStats));
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
      <PanGestureHandler onGestureEvent={panGestureHandler}>
        <Animated.View
          className="flex flex-row justify-between"
          style={[
            {
              width: 2 * SCREEN_WIDTH,
            },
            animatedStyle,
          ]}
        >
          <DashboardStatsPage
            heading="Overall Stats"
            overall={overall / 100}
            overallLabel={`${overall.toFixed(0)}%`}
            stats={stats ? formatStatsObject(stats) : []}
            className="ml-9"
          />
          <DashboardStatsPage
            heading="Potential Stats"
            overall={potentialOverall / 100}
            overallLabel={`${potentialOverall.toFixed(0)}%`}
            stats={
              potentialStats && stats
                ? formatStatsObject(stats, potentialStats)
                : []
            }
            className="mr-9"
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
    </SafeAreaView>
  );
}
