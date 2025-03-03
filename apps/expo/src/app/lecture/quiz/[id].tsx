import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, View } from "react-native";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { QuestionItem } from "~/components/question-item";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";

export default function LectureQuiz() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");
  const { data: lecture } = api.lecture.byId.useQuery({ id });

  const createQuiz = api.lecture.createQuiz.useMutation();
  const [questions, setQuestions] = useState<
    {
      question: string;
      choices: string[];
      answerIndex: number;
    }[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [_, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setCorrectAnswers(0);
    setShowResults(false);
  };

  function formatRecapTitle() {
    const accuracy = (correctAnswers / questions.length) * 100;
    if (accuracy >= 90) return "Excellent job!";
    if (accuracy >= 75) return "Good job!";
    if (accuracy >= 50) return "Not bad!";
    return "Better luck next time!";
  }

  useEffect(() => {
    if (!lecture) return;
    if (questions.length > 0) return;

    // Use existing questions.
    if (lecture.questions.length > 0) {
      setQuestions(
        lecture.questions.map(({ question, choices, answerIndex }) => ({
          question,
          choices,
          answerIndex,
        })),
      );
      return;
    }

    // Generate questions
    void (async () => {
      const questions = await createQuiz.mutateAsync({
        lectureId: lecture.id,
      });
      setQuestions(
        questions.map(({ question, choices, answerIndex }) => ({
          question,
          choices,
          answerIndex,
        })),
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lecture || !questions[currentQuestion])
    return (
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <ChevronLeft
                className="m-0 p-0"
                color={NAV_THEME[colorScheme].secondaryForeground}
                size={20}
              />
            </Pressable>
          ),
          headerTitle: "Quiz",
        }}
      />
    );

  return (
    <SafeAreaView className={cn("h-full w-full flex-1 bg-background")}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <ChevronLeft
                className="m-0 p-0"
                color={NAV_THEME[colorScheme].secondaryForeground}
                size={20}
              />
            </Pressable>
          ),
          headerTitle: "Quiz",
        }}
      />
      {questions.length > 0 ? (
        <View className="flex-1">
          <View className="mt-4 w-full px-4">
            <Progress value={(currentQuestion * 100) / questions.length} />
            <Text className="mt-2 text-xl font-semibold">
              {questions.length > 0
                ? `${currentQuestion + 1}/${questions.length}`
                : ""}
            </Text>
          </View>
          <View className="mt-28 flex-1 items-center justify-center px-4">
            {currentQuestion < questions.length ? (
              <QuestionItem
                question={questions[currentQuestion]}
                onNext={({ isCorrect, selectedAnswer }) => {
                  if (isCorrect) setCorrectAnswers(correctAnswers + 1);
                  setSelectedAnswer(selectedAnswer);
                  if (currentQuestion === questions.length - 1)
                    setShowResults(true);
                  else setCurrentQuestion(currentQuestion + 1);
                }}
              />
            ) : null}
            <Dialog open={showResults} onOpenChange={setShowResults}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{formatRecapTitle()}</DialogTitle>
                  <DialogDescription>
                    You got {correctAnswers} out of {questions.length} questions
                    correct!
                  </DialogDescription>
                </DialogHeader>
                <View className="mt-4 flex flex-row justify-end gap-x-2">
                  <DialogClose asChild>
                    <Pressable
                      className="rounded-lg bg-secondary px-4 py-2"
                      onPress={() => router.back()}
                    >
                      <Text className="text-secondary-foreground">
                        Back to Notes
                      </Text>
                    </Pressable>
                  </DialogClose>
                  <DialogClose asChild>
                    <Pressable
                      className="rounded-lg bg-primary px-4 py-2"
                      onPress={resetQuiz}
                    >
                      <Text className="text-primary-foreground">Try Again</Text>
                    </Pressable>
                  </DialogClose>
                </View>
              </DialogContent>
            </Dialog>
          </View>
        </View>
      ) : (
        // Debug why this loading state never shows.
        <View className="h-full flex-col items-center justify-center gap-4">
          <ActivityIndicator
            color={NAV_THEME[colorScheme].secondaryForeground}
          />
          <Text className="text-lg font-medium text-muted-foreground">
            Generating questions...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
