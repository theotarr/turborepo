import { useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { Question } from "~/components/question";
import { setHabits } from "~/lib/storage";
import { habitQuestions } from "~/lib/tests";

export default function Habits() {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    {
      question: string;
      answer: string;
    }[]
  >([]);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mt-8">
        <Question
          question={habitQuestions[questionIndex]?.question ?? ""}
          options={habitQuestions[questionIndex]?.options ?? []}
          selectedOption={selectedOption}
          onSelect={async (option: string) => {
            setAnswers((prev) => [
              ...prev,
              {
                question: habitQuestions[questionIndex]?.question ?? "",
                answer: option,
              },
            ]);
            setSelectedOption(option);

            if (questionIndex === habitQuestions.length - 1) {
              await setHabits(answers);
              router.back();
            } else {
              setTimeout(() => {
                setQuestionIndex((prev) => prev + 1);
                setSelectedOption(undefined);
              }, 1000);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
