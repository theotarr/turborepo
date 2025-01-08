import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { Text } from "./ui/text";

interface QuestionProps {
  question: {
    question: string;
    choices: string[];
    answerIndex: number;
    selectedAnswer?: string;
  };
  onNext: ({
    isCorrect,
    selectedAnswer,
  }: {
    isCorrect: boolean;
    selectedAnswer: string;
  }) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuestionItem({ question, onNext }: QuestionProps) {
  const { colorScheme } = useColorScheme();
  const shuffled = useMemo(() => {
    const choices = [...question.choices];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]] as [string, string];
    }
    return choices;
  }, [question.choices]);

  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!answer) return;

    function isCorrectAnswer(answer: string) {
      return answer === question.choices[question.answerIndex];
    }

    const interval = setInterval(() => {
      onNext({
        isCorrect: isCorrectAnswer(answer),
        selectedAnswer: answer,
      });
      setAnswer("");
    }, 1000);

    return () => clearInterval(interval);
  }, [answer, onNext, question]);

  const getAnimatedStyle = (option: string) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAnimatedStyle(() => {
      const isCorrect = answer === question.choices[question.answerIndex];
      const isSelected = option === answer;
      const isCorrectAnswer = option === question.choices[question.answerIndex];

      if (!answer) {
        return {
          backgroundColor: withTiming("transparent", { duration: 300 }),
        };
      }

      const color =
        isCorrect && isSelected
          ? `hsl(${NAV_THEME[colorScheme].primary})`
          : isSelected
            ? `hsl(${NAV_THEME[colorScheme].destructive})`
            : isCorrectAnswer && !isCorrect
              ? `hsl(${NAV_THEME[colorScheme].primary})`
              : "transparent";

      return {
        backgroundColor: withTiming(color, { duration: 300 }),
      };
    });
  };

  return (
    <View className="mt-6 w-full flex-1 flex-col gap-y-3">
      <Text className="text-2xl font-medium">{question.question}</Text>
      <View className="mt-6 flex-1 flex-col">
        {shuffled.map((option) => (
          <AnimatedPressable
            key={option}
            style={getAnimatedStyle(option)}
            className={cn(
              "mt-3 min-h-16 flex-row items-center rounded-xl border border-border px-4 py-3",
            )}
            onPress={() => !answer && setAnswer(option)}
          >
            <Text className="text-base font-medium text-secondary-foreground">
              {option}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}
