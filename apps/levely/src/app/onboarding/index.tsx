import { useCallback, useEffect, useState } from "react";
import { Pressable, SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import type { Question as QuestionType, Subject } from "~/types/types";
import { GradeInput } from "~/components/grades";
import { MemorySection } from "~/components/memory";
import { Pagination } from "~/components/pagination";
import { Question } from "~/components/question";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  getOnboardingComplete,
  setFocus,
  setGrades,
  setHabits,
  setOnboardingComplete,
  setStats,
} from "~/lib/storage";
import { api } from "~/utils/api";

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

const defaultSubjects = [
  { id: 0, name: "Calculus", grade: "A-" },
  { id: 1, name: "Physics", grade: "A-" },
  { id: 2, name: "Philosophy", grade: "A-" },
] as Subject[];

export default function Onboarding() {
  const router = useRouter();
  const generateStatsMutation = api.levely.generateStats.useMutation();

  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionType[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    undefined,
  );
  const [memoryProgress, setMemoryProgress] = useState((1 / 3) * 100);

  const calcStepProgress = useCallback(() => {
    // If the user is on the memory section, return the memory progress.
    if (sectionIndex === 1) return memoryProgress;
    // If the user is on the habits or focus section, return the progress based on the number of questions answered.
    const currentSection = sections[sectionIndex];
    const currentQuestion = currentSection?.questions[questionIndex];
    if (!currentSection || !currentQuestion) return 0;
    return ((questionIndex + 1) / currentSection.questions.length) * 100;
  }, [sectionIndex, questionIndex, memoryProgress]);

  const [progress, setProgress] = useState(calcStepProgress());
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects);

  useEffect(() => {
    setProgress(calcStepProgress());
  }, [sectionIndex, questionIndex, memoryProgress, calcStepProgress]);

  // If the user has already onboarded, redirect to the stats page.
  useEffect(() => {
    void (async () => {
      const hasOnboarded = await getOnboardingComplete();
      if (hasOnboarded) router.replace("/stats/current");
    })();
  }, [router]);

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          title: "Onboarding",
          header: () => <></>,
        }}
      />
      <View className="h-full w-full">
        <Pagination
          totalSteps={sections.length}
          currentStepIndex={sectionIndex}
          steps={sections.map((section) => section.name)}
          progress={progress}
        />
        <View className="flex h-full justify-around">
          {/* If the current section is either habits or focus questions */}
          {sectionIndex === 0 || sectionIndex === 2 ? (
            <Question
              question={
                sections[sectionIndex]?.questions[questionIndex]
                  ?.question as string
              }
              options={
                sections[sectionIndex]?.questions[questionIndex]
                  ?.options as unknown as string[]
              }
              selectedOption={selectedOption}
              onSelect={(option) => {
                setAnswers((prev) => [
                  ...prev,
                  {
                    question: sections[sectionIndex]?.questions[questionIndex]
                      ?.question as string,
                    answer: option,
                  },
                ]);
                setSelectedOption(option);

                // Check if the current question is the last question in the section
                // If it is, move to the next section
                if (
                  questionIndex ===
                  (sections[sectionIndex]?.questions?.length ?? 0) - 1
                ) {
                  setTimeout(() => {
                    void (async () => {
                      // Save answers to storage.
                      if (sectionIndex === 0) await setHabits(answers);
                      else await setFocus(answers);
                      // Move to next section.
                      setQuestionIndex(0);
                      setSectionIndex((prev) => prev + 1);
                    })();
                  }, 1000);
                } else {
                  setTimeout(() => {
                    setQuestionIndex((prev) => prev + 1);
                  }, 1000);
                }
              }}
            />
          ) : sectionIndex === 1 ? (
            <MemorySection
              onProgress={setMemoryProgress}
              onSectionComplete={() => setSectionIndex((prev) => prev + 1)}
            />
          ) : sectionIndex === 4 ? (
            <>
              <Text className="mx-6 mb-4 mt-8 text-2xl font-bold text-secondary-foreground">
                Add your grades
              </Text>
              <Pressable
                className="absolute right-4 top-4 flex size-16 items-center justify-center rounded-full bg-primary"
                disabled={generateStatsMutation.isLoading}
                onPress={async () => {
                  try {
                    await setGrades(subjects);
                    const stats = await generateStatsMutation.mutateAsync({
                      questions: answers,
                    });
                    await setStats(stats);
                    await setOnboardingComplete();
                    router.replace("/stats/current");
                  } catch (error) {
                    console.error("Failed to generate stats:", error);
                  }
                }}
              >
                {generateStatsMutation.isLoading ? (
                  <View className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <SymbolView
                    name="arrow.right"
                    resizeMode="scaleAspectFit"
                    size={24}
                    weight="light"
                    tintColor="white"
                  />
                )}
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
            <Button onPress={() => setSectionIndex((prev) => prev + 1)}>
              <Text>Next</Text>
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
