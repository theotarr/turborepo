import { useState } from "react";
import { View } from "react-native";
import { SymbolView } from "expo-symbols";

import { setMemoryAccuracy, setMemoryScore } from "~/lib/storage";
import {
  calcReadingSpeed,
  getReadingSpeedPercentile,
  readingPassgage,
  readingQuestions,
} from "~/lib/tests";
import { CircularProgress } from "./circular-progress";
import { Question } from "./question";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

export function MemorySection({
  onProgress,
  onSectionComplete,
}: {
  onProgress: (progress: number) => void;
  onSectionComplete: () => void;
}) {
  const [page, setPage] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(Date.now());
  const timeElapsed = endTime - startTime;
  const [answers, setAnswers] = useState<string[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  const handleStart = () => {
    setStartTime(Date.now());
    setPage(1);
    onProgress((1 / 4) * 100);
  };

  const handleContentRead = () => {
    setPage(2);
    setEndTime(Date.now());
    onProgress((2 / 4) * 100);
  };

  function calcAccuracy(answers: string[]) {
    let correct = 0;
    for (let i = 0; i < readingQuestions.length; i++) {
      if (answers[i] === readingQuestions[i]?.correctAnswer) {
        correct++;
      }
    }

    setCorrectAnswers(correct);
    setAccuracy(correct / readingQuestions.length);
  }

  return (
    <View className="flex h-full">
      {page === 0 ? (
        <View className="flex items-center justify-center p-4">
          <Text className="mb-8 max-w-[18rem] text-center text-2xl font-bold text-secondary-foreground">
            Let's test your memory and reading speed.
          </Text>
          <Button onPress={handleStart}>
            <Text>Start</Text>
          </Button>
        </View>
      ) : page === 1 ? (
        <View className="p-4">
          <Text className="mb-6 text-2xl font-bold text-secondary-foreground">
            Read this as fast as you can.
          </Text>
          <Text className="text-lg text-secondary-foreground">
            {readingPassgage}
          </Text>
          <View className="mt-6 flex-row items-center justify-center">
            <Button
              onPress={handleContentRead}
              className="w-36 flex-row items-center gap-x-2"
            >
              <SymbolView name="stopwatch" size={16} tintColor="white" />
              <Text>Stop timer</Text>
            </Button>
          </View>
        </View>
      ) : page === 2 ? (
        <Question
          question={readingQuestions[questionIndex]?.question ?? ""}
          options={readingQuestions[questionIndex]?.options ?? []}
          selectedOption={selectedOption}
          onSelect={(option) => {
            calcAccuracy([...answers, option]); // Pass in the last answer, since state has not updated yet.
            setSelectedOption(option);
            setAnswers((prev) => [...prev, option]);

            if (questionIndex === readingQuestions.length - 1) {
              setTimeout(() => {
                onProgress((3 / 4) * 100);
                setPage(3);
              }, 1000);
            } else {
              setTimeout(() => {
                setQuestionIndex((prev) => prev + 1);
              }, 1000);
            }
          }}
        />
      ) : page === 3 ? (
        <View className="flex items-center justify-center p-4">
          <Text className="mb-8 max-w-sm text-center text-xl text-secondary-foreground">
            You got {correctAnswers} out of {readingQuestions.length} questions
            correct
          </Text>
          <CircularProgress
            progress={accuracy}
            radius={80}
            strokeWidth={20}
            label={`${accuracy * 100}%`}
          />
          <Button
            className="mt-8"
            onPress={() => {
              onProgress((4 / 4) * 100);
              setPage(4);
            }}
          >
            <Text>Continue</Text>
          </Button>
        </View>
      ) : page === 4 ? (
        <View className="flex items-center justify-center">
          <Text className="mb-8 max-w-sm text-center text-xl text-secondary-foreground">
            Your reading speed is{" "}
            {calcReadingSpeed(readingPassgage, timeElapsed)} WPM
          </Text>
          <CircularProgress
            progress={Math.round(
              (readingPassgage.split(" ").length / (timeElapsed / 1000)) * 60,
            )}
            radius={80}
            strokeWidth={20}
            label={`${Math.round(
              calcReadingSpeed(readingPassgage, timeElapsed),
            )}`}
          />
          <Text className="mt-8 max-w-[16rem] text-center text-xl text-secondary-foreground">
            {getReadingSpeedPercentile(
              calcReadingSpeed(readingPassgage, timeElapsed),
            )}
          </Text>
          <Button
            className="mt-4"
            onPress={async () => {
              console.log("correctAnswers", correctAnswers);
              console.log("accuracy", accuracy);

              await setMemoryScore(
                calcReadingSpeed(readingPassgage, timeElapsed),
              );
              await setMemoryAccuracy(accuracy * 100);
              onSectionComplete();
            }}
          >
            <Text>Continue</Text>
          </Button>
        </View>
      ) : null}
    </View>
  );
}
