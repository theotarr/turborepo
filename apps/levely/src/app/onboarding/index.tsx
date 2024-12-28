import { useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import { Pagination } from "~/components/pagination";
import { Question } from "~/components/question";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

const habitQuestions = [
  {
    question: "How much do you study each week?",
    options: ["Less than 1 hour", "1-5 hours", "6-10 hours", "10+ hours"],
  },
  {
    question:
      "How much time do you spend on your phone daily (non-essential use)?",
    options: [
      "Less than 2 hours",
      "2-4 hours",
      "4-6 hours",
      "More than 6 hours",
    ],
  },
  {
    question:
      "How many hours do you work out or engage in physical activity weekly?",
    options: [
      "Less than 1 hour",
      "1-3 hours",
      "4-6 hours",
      "More than 6 hours",
    ],
  },
  {
    question: "How many hours of sleep do you get each night?",
    options: [
      "Less than 5 hours",
      "5-6 hours",
      "7-8 hours",
      "More than 8 hours",
    ],
  },
] as const;

const focusQuestions = [
  {
    question: "How often do you work without getting distracted?",
    options: ["Never", "Rarely", "Sometimes", "Always"],
  },
  {
    question:
      "How long can you stay fully focused on a single task without becoming distracted?",
    options: [
      "Less than 10 minutes",
      "10-30 minutes",
      "30-60 minutes",
      "More than 60 minutes",
    ],
  },
  {
    question:
      "How easily do you lose focus when working on a challenging task?",
    options: ["Very easily", "Somewhat easily", "Rarely", "Never"],
  },
  {
    question:
      "How well do you manage intrusive thoughts or worries while working?",
    options: ["Not at all", "Somewhat", "Well", "Very well"],
  },
  {
    question:
      "What percentage of your planned tasks do you typically complete in a day?",
    options: ["Less than 30%", "30-70%", "70-100%"],
  },
  {
    question: "Do you regularly postpone tasks to the next day?",
    options: ["Often", "Sometimes", "Rarely"],
  },
  {
    question: "Do you take breaks to recharge during the day?",
    options: ["Never", "Occasionally", "Frequently"],
  },
] as const;

const sections = [
  { name: "Habits", questions: habitQuestions },
  { name: "Focus", questions: focusQuestions },
  // Add other sections here with their respective questions
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { question: string; answer: string }[]
  >([]);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );
  const progress = sections[currentSectionIndex]?.questions
    ? ((currentQuestionIndex + 1) /
        sections[currentSectionIndex].questions.length) *
      100
    : 0;

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          title: "Onboarding",
          headerLeft: () => (
            <Button
              onPress={() => {
                router.replace("/");
              }}
            >
              <Text>Back</Text>
            </Button>
          ),
        }}
      />
      <View className="h-full w-full">
        <Pagination
          totalSteps={sections.length}
          currentStep={step}
          steps={sections.map((section) => section.name)}
          progress={progress}
        />
        <View className="flex h-full justify-around">
          {/* If the current section is either habits or focus questions */}
          {currentSectionIndex === 0 || 3 ? (
            <Question
              question={
                sections[currentQuestionIndex]?.questions[currentQuestionIndex]
                  ?.question as string
              }
              options={
                sections[currentQuestionIndex]?.questions[currentQuestionIndex]
                  ?.options as unknown as string[]
              }
              selectedOption={selectedOption}
              onSelect={(option) => {
                setAnswers((prev) => [
                  ...prev,
                  {
                    question: sections[currentSectionIndex]?.questions[
                      currentQuestionIndex
                    ]?.question as string,
                    answer: option,
                  },
                ]);
                setSelectedOption(option);

                if (
                  currentQuestionIndex ===
                  (sections[currentSectionIndex]?.questions?.length ?? 0) - 1
                ) {
                  setTimeout(() => {
                    setCurrentQuestionIndex(0);
                    setCurrentSectionIndex((prev) => prev + 1);
                  }, 1000);
                } else {
                  setTimeout(() => {
                    setCurrentQuestionIndex((prev) => prev + 1);
                  }, 1000);
                }
              }}
            />
          ) : (
            <></>
          )}
        </View>
        <Button onPress={() => setStep((prev) => prev + 1)}>
          <Text>Next</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
