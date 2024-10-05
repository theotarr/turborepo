import type { PanGestureHandlerGestureEvent } from "react-native-gesture-handler";
import React, { useCallback, useEffect, useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ArrowLeft, ArrowRight } from "lucide-react-native";

import { Progress } from "~/components/ui/progress";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface FlashcardProps {
  frontContent: string;
  backContent: string;
  onSwipe: (direction: "left" | "right") => void;
  className?: string;
  isActive: boolean;
}

interface FlashcardDeckProps {
  cards: { front: string; back: string }[];
}

interface AnimatedGHContext {
  startX: number;
}

const Flashcard: React.FC<FlashcardProps> = ({
  frontContent,
  backContent,
  onSwipe,
  className,
  isActive,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotate = useSharedValue(0);
  const translateX = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [30, 0, -30],
      Extrapolate.CLAMP,
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotate.value}deg` },
        { translateX: translateX.value },
        { rotateY: `${rotateValue}deg` },
      ],
      backfaceVisibility: "hidden",
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [30, 0, -30],
      Extrapolate.CLAMP,
    );

    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotate.value + 180}deg` },
        { translateX: translateX.value },
        { rotateY: `${rotateValue}deg` },
      ],
      backfaceVisibility: "hidden",
    };
  });

  const flipCard = () => {
    const newValue = isFlipped ? 0 : 180;
    rotate.value = withTiming(newValue, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    setIsFlipped(!isFlipped);
  };

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      onSwipe(direction);
    },
    [onSwipe],
  );

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    AnimatedGHContext
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
    },
    onEnd: (event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      const direction = event.velocityX > 0 ? "right" : "left";

      if (shouldSwipe) {
        translateX.value = withTiming(
          direction === "right" ? SCREEN_WIDTH : -SCREEN_WIDTH,
          { duration: 200 },
          () => {
            runOnJS(handleSwipe)(direction);
          },
        );
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    },
  });

  useEffect(() => {
    if (isActive) {
      translateX.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, translateX]);

  return (
    <PanGestureHandler onGestureEvent={gestureHandler} enabled={isActive}>
      <Animated.View
        className={cn("absolute left-1/2 -ml-40 h-80 w-80", className)}
      >
        <Pressable onPress={flipCard} className="absolute h-full w-full">
          <Animated.View
            className="absolute h-full w-full items-center justify-center rounded-2xl bg-card shadow"
            style={[frontAnimatedStyle]}
          >
            <Text className="p-4 text-center text-2xl font-medium">
              {frontContent}
            </Text>
          </Animated.View>
          <Animated.View
            className="absolute h-full w-full items-center justify-center rounded-2xl border-2 border-primary/80 bg-card"
            style={[backAnimatedStyle]}
          >
            <Text className="p-4 text-center text-xl font-medium">
              {backContent}
            </Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
  );
};

const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards }) => {
  const { colorScheme } = useColorScheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
        setProgress((prev) => Math.max(0, prev - 1));
      } else if (direction === "left" && currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setProgress((prev) => Math.min(cards.length, prev + 1));
      }
    },
    [currentIndex, cards.length],
  );

  return (
    <View className="flex-1 items-center justify-center">
      <Progress
        className="align-center absolute top-4 z-10 w-[90%] border border-border"
        value={((progress + 1) / cards.length) * 100}
      />
      <View className="relative h-96 w-80">
        {cards.map((card, index) => (
          <Flashcard
            key={index}
            frontContent={card.front}
            backContent={card.back}
            onSwipe={handleSwipe}
            isActive={index === currentIndex}
            className={cn(
              "absolute",
              index === currentIndex
                ? "z-10 scale-100 opacity-100"
                : index === currentIndex + 1
                  ? "z-5 translate-x-4 scale-95 opacity-80"
                  : index === currentIndex - 1
                    ? "z-5 -translate-x-4 scale-95 opacity-80"
                    : "z-0 scale-90 opacity-0",
              "transition-all duration-300 ease-in-out",
            )}
          />
        ))}
      </View>
      <View className="absolute bottom-8 flex-row gap-4">
        <Button
          onPress={() => handleSwipe("right")}
          disabled={currentIndex === 0}
          className="flex flex-row"
        >
          <ArrowLeft
            color={NAV_THEME[colorScheme].primaryForeground}
            size={16}
          />
          <Text className="ml-2">Prev</Text>
        </Button>
        <Button
          onPress={() => handleSwipe("left")}
          disabled={currentIndex === cards.length - 1}
          className="flex flex-row"
        >
          <Text className="mr-2">Next</Text>
          <ArrowRight
            color={NAV_THEME[colorScheme].primaryForeground}
            size={16}
          />
        </Button>
      </View>
    </View>
  );
};

export { Flashcard, FlashcardDeck };
