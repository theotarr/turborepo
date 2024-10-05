"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateQuiz } from "@/lib/lecture/quiz";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";
import { Course, Lecture } from "@prisma/client";
import { readStreamableValue } from "ai/rsc";

import { QuestionItem } from "./question-item";
import { Button, buttonVariants } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Progress } from "./ui/progress";

interface QuizPageProps {
  lecture: Lecture & {
    course: Course;
    questions: {
      id: string;
      question: string;
      choices: string[];
      answerIndex: number;
    }[];
  };
}

export const QuizPage = ({ lecture }: QuizPageProps) => {
  const [questions, setQuestions] = useState<
    {
      id: string;
      question: string;
      choices: string[];
      answerIndex: number;
      selectedAnswer?: string;
    }[]
  >(lecture.questions ?? []);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isQuizCompleteDialogOpen, setIsQuizCompleteDialogOpen] =
    useState(false);

  function formatRecapTitle() {
    if (!questions || !questions.length) return "";
    const accuracy = (correctAnswers / questions.length) * 100;
    if (accuracy >= 90) return "Excellent job!";
    if (accuracy >= 75) return "Good job!";
    if (accuracy >= 50) return "Not bad!";
    return "Better luck next time!";
  }

  // On page load, check if any flashcards exist, if not, stream generate them.
  useEffect(() => {
    async function generate() {
      const object = await generateQuiz(
        lecture.id,
        lecture.transcript as any as Transcript[],
      );

      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject && partialObject.questions) {
          // Only update if the entire question object is available.
          if (
            partialObject.questions[partialObject.questions.length - 1] &&
            partialObject.questions[partialObject.questions.length - 1]
              .answerIndex
          ) {
            // Only update the last question in the array not to reshuffle the answers.
            setQuestions((questions) => {
              const question =
                partialObject.questions[partialObject.questions.length - 1];
              return [...questions, question];
            });
          }
        }
      }
    }

    if (lecture.questions.length === 0) generate();
    else setQuestions(lecture.questions);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Dialog
        open={isQuizCompleteDialogOpen}
        onOpenChange={setIsQuizCompleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">{formatRecapTitle()}</DialogTitle>
          </DialogHeader>
          {questions && (
            <p className="py-4 text-lg">
              You got <strong>{correctAnswers}</strong> out of{" "}
              <strong>{questions.length}</strong> questions correct.
            </p>
          )}
          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <Link
                href={`/lecture/${lecture.id}`}
                className={cn(
                  buttonVariants({
                    variant: "secondary",
                  }),
                )}
              >
                Back to Notes
              </Link>
              <Button
                onClick={() => {
                  setIsQuizCompleteDialogOpen(false);
                  window.location.reload();
                }}
              >
                Play Again
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="my-16 flex flex-col items-center space-y-6 pb-16">
        <h1 className="text-2xl font-medium tracking-tighter">
          Quiz on &quot;{lecture.title}&quot;
        </h1>
        <div className="mx-auto max-w-screen-xl p-4">
          <div className="flex w-full flex-row justify-between text-xl font-semibold">
            <div className="flex-1">
              {questions.length > 0 ? (
                <>
                  {currentQuestion + 1}/{questions.length}
                </>
              ) : (
                "Generating questions..."
              )}
            </div>
          </div>
          {questions.length > 0 ? (
            <>
              <div className="flex w-full flex-row justify-between py-5">
                <Progress value={(currentQuestion * 100) / questions.length} />
              </div>
              <QuestionItem
                question={questions[currentQuestion]}
                onNext={({ isCorrect, selectedAnswer }) => {
                  if (isCorrect) setCorrectAnswers(correctAnswers + 1);

                  // Update the selected answer.
                  setQuestions((questions) => {
                    const question = questions[currentQuestion];
                    question.selectedAnswer = selectedAnswer;
                    return [...questions];
                  });

                  // Check for the end of the quiz.
                  if (currentQuestion === questions.length - 1)
                    setIsQuizCompleteDialogOpen(true);
                  else setCurrentQuestion(currentQuestion + 1);
                }}
              />
            </>
          ) : (
            <QuestionItem.Skeleton />
          )}
        </div>
      </div>
    </>
  );
};
