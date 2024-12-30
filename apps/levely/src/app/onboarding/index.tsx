import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { GradeInput, Subject } from "~/components/grades";
import { MemorySection } from "~/components/memory";
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
  { name: "Memorization", questions: [] },
  { name: "Focus", questions: focusQuestions },
  { name: "Reading", questions: [] },
  { name: "Grades", questions: [] },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(4);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    { question: string; answer: string }[]
  >([]);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );
  const [memoryProgress, setMemoryProgress] = useState((1 / 3) * 100);
  const [progress, setProgress] = useState(calcStepProgress());
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 0, name: "Calculus", grade: "B-" },
    { id: 1, name: "Physics", grade: "B-" },
    { id: 2, name: "Philosophy", grade: "B-" },
  ]);

  function calcStepProgress() {
    if (currentSectionIndex === 1) return memoryProgress;

    const currentSection = sections[currentSectionIndex];
    const currentQuestion = currentSection?.questions[currentQuestionIndex];

    if (!currentSection || !currentQuestion) {
      return 0;
    }

    return ((currentQuestionIndex + 1) / currentSection.questions.length) * 100;
  }

  useEffect(() => {
    setProgress(calcStepProgress());
  }, [currentSectionIndex, currentQuestionIndex, memoryProgress]);

  console.log(answers);
  console.log(subjects);

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          title: "Onboarding",
          header: () => <></>,
          headerLeft: () => (
            <Button
              onPress={() => {
                router.replace("/");
              }}
              variant="secondary"
              size="sm"
            >
              <Text>Back</Text>
            </Button>
          ),
        }}
      />
      <View className="h-full w-full">
        <Pagination
          totalSteps={sections.length}
          currentStepIndex={currentSectionIndex}
          steps={sections.map((section) => section.name)}
          progress={progress}
        />
        <View className="flex h-full justify-around">
          {/* If the current section is either habits or focus questions */}
          {currentSectionIndex === 0 || currentSectionIndex === 2 ? (
            <Question
              question={
                sections[currentSectionIndex]?.questions[currentQuestionIndex]
                  ?.question as string
              }
              options={
                sections[currentSectionIndex]?.questions[currentQuestionIndex]
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

                // Check if the current question is the last question in the section
                // If it is, move to the next section
                if (
                  currentQuestionIndex ===
                  sections[currentSectionIndex]?.questions?.length! - 1
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
          ) : currentSectionIndex === 1 ? (
            <MemorySection
              onProgress={setMemoryProgress}
              onSectionComplete={() =>
                setCurrentSectionIndex((prev) => prev + 1)
              }
            />
          ) : currentSectionIndex === 4 ? (
            <>
              <Text className="mx-6 mb-4 mt-8 text-2xl font-bold text-secondary-foreground">
                Add your grades
              </Text>
              <Pressable
                className="absolute right-4 top-4 flex size-16 items-center justify-center rounded-full bg-primary"
                onPress={() => router.replace("/stats/current")}
              >
                <SymbolView
                  name="arrow.right"
                  resizeMode="scaleAspectFit"
                  size={24}
                  weight="light"
                  tintColor="white"
                />
              </Pressable>
              <ScrollView className="mx-2">
                {subjects.map((subject) => (
                  <GradeInput
                    key={subject.id}
                    subject={subject}
                    initialGrade={subject.grade}
                    onSubjectChange={(newSubject) => {
                      setSubjects((prev) =>
                        prev.map((s) =>
                          s.id === newSubject.id ? newSubject : s,
                        ),
                      );
                    }}
                  />
                ))}
                <View className="mx-2 mb-16 flex justify-end">
                  <Button
                    variant="secondary"
                    onPress={() => {
                      setSubjects((prev) => [
                        ...prev,
                        { id: prev.length, name: "", grade: "A" },
                      ]);
                    }}
                  >
                    <Text>Add subject</Text>
                  </Button>
                </View>
              </ScrollView>
            </>
          ) : (
            <Button onPress={() => setCurrentSectionIndex((prev) => prev + 1)}>
              <Text>Next</Text>
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
