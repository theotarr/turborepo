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

import { StatsPage } from "~/components/stats-page";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const statCategories = [
  "Memory",
  "Focus",
  "Reading",
  "Discipline",
  "Stress Management",
  "Time Management",
];
const gradeCategories = [
  "Math",
  "Science",
  "English",
  "History",
  "Art",
  "Latin",
];

export default function Current() {
  const router = useRouter();
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
                overall={0.73}
                overallLabel="73%"
                stats={[
                  {
                    stat: "Memory",
                    label: "80",
                    value: 80,
                  },
                  {
                    stat: "Focus",
                    label: "80",
                    value: 80,
                  },
                  {
                    stat: "Reading",
                    label: "75",
                    value: 75,
                  },
                  {
                    stat: "Discipline",
                    label: "70",
                    value: 70,
                  },
                  {
                    stat: "Stress Management",
                    label: "65",
                    value: 65,
                  },
                  {
                    stat: "Time Management",
                    label: "85",
                    value: 85,
                  },
                ]}
              />
              <StatsPage
                heading="Grades"
                overall={0.8}
                overallLabel="80%"
                stats={[
                  {
                    stat: "Math",
                    label: "B-",
                    value: 80,
                  },
                  {
                    stat: "Science",
                    label: "B",
                    value: 85,
                  },
                  {
                    stat: "English",
                    label: "C",
                    value: 75,
                  },
                  {
                    stat: "History",
                    label: "C-",
                    value: 70,
                  },
                  {
                    stat: "Art",
                    label: "A-",
                    value: 90,
                  },
                  {
                    stat: "Latin",
                    label: "D",
                    value: 65,
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
        onPress={() => {
          router.replace("/stats/potential");
        }}
      >
        <Text className="text-center text-lg font-semibold text-primary-foreground">
          See your potential
        </Text>
      </Button>
    </SafeAreaView>
  );
}