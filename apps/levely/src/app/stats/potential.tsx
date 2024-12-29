import { Dimensions, SafeAreaView, View } from "react-native";
import { PanGestureHandler, ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { Share } from "lucide-react-native";

import { StatsPage } from "~/components/stats-page";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";

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

export default function Potential() {
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
                stats={[
                  {
                    stat: "Memory",
                    label: "90",
                    value: 90,
                    improvement: "15%",
                  },
                  {
                    stat: "Focus",
                    label: "92",
                    value: 92,
                    improvement: "12%",
                  },
                  {
                    stat: "Reading",
                    label: "88",
                    value: 88,
                    improvement: "13%",
                  },
                  {
                    stat: "Discipline",
                    label: "80",
                    value: 80,
                    improvement: "10%",
                  },
                  {
                    stat: "Stress Management",
                    label: "75",
                    value: 75,
                    improvement: "10%",
                  },
                  {
                    stat: "Time Management",
                    label: "95",
                    value: 95,
                    improvement: "10%",
                  },
                ]}
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
          <Button variant="ghost" className="mb-5 flex-row items-center">
            <Share size={16} color={NAV_THEME.light.secondaryForeground} />
            <Text className="ml-2 text-secondary-foreground">
              Share my report
            </Text>
          </Button>
        </ScrollView>
      </View>
      <View className="mb-8 mt-4 flex items-center">
        <View className="h-6 w-12 flex-row items-center justify-center rounded-full bg-[#BFBFBF] opacity-[44%]">
          <View
            className={`mx-1 size-2 rounded-full ${
              currentPage.value === 0 ? "bg-black" : "bg-black/30"
            }`}
          />
          <View
            className={`mx-1 size-2 rounded-full ${
              currentPage.value === 1 ? "bg-black" : "bg-black/30"
            }`}
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
          Go to home
        </Text>
      </Button>
    </SafeAreaView>
  );
}
