import { useCallback, useEffect, useState } from "react";
import { SafeAreaView, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import type { Question as QuestionType, Stats, Subject } from "~/types/types";
import { GradeInput } from "~/components/grades";
import { MemorySection } from "~/components/memory";
import { Pagination } from "~/components/pagination";
import { Question } from "~/components/question";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  getMemoryAccuracy,
  getMemoryScore,
  setFocus,
  setGrades,
  setHabits,
  setOnboardingComplete,
  setStats,
} from "~/lib/storage";
import {
  calcMemoryScore,
  calcReadingScore,
  defaultSubjects,
  sections,
} from "~/lib/tests";
import { api } from "~/utils/api";

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

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
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
              question={sections[sectionIndex]?.questions[questionIndex]?.question!}
              options={
                sections[sectionIndex]?.questions[questionIndex]
                  ?.options as unknown as string[]
              }
              selectedOption={selectedOption}
              onSelect={(option) => {
                setAnswers((prev) => [
                  ...prev,
                  {
                    question:
                      sections[sectionIndex]?.questions[questionIndex]
                        ?.question!,
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
          ) : sectionIndex === 3 ? (
            <>
              <Text className="mx-6 mb-4 mt-8 text-2xl font-bold text-secondary-foreground">
                Add your grades
              </Text>
              <TouchableOpacity
                className="absolute right-4 top-4 flex size-16 items-center justify-center rounded-full bg-primary"
                disabled={generateStatsMutation.isPending}
                onPress={async () => {
                  try {
                    await setGrades(subjects);
                    const stats = await generateStatsMutation.mutateAsync({
                      questions: answers,
                      memory: calcMemoryScore(
                        await getMemoryAccuracy(),
                        calcReadingScore(
                          await getMemoryScore(),
                          await getMemoryAccuracy(),
                        ),
                      ),
                      reading: calcReadingScore(
                        await getMemoryScore(),
                        await getMemoryAccuracy(),
                      ),
                    });
                    await setStats(stats as unknown as Stats);
                    await setOnboardingComplete();
                    router.replace("/stats/current");
                  } catch (error) {
                    console.error("Failed to generate stats:", error);
                  }
                }}
              >
                <SymbolView
                  name="arrow.right"
                  resizeMode="scaleAspectFit"
                  size={24}
                  weight="light"
                  tintColor="white"
                />
              </TouchableOpacity>
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
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
