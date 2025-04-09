"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Lecture } from "@prisma/client";
import { motion } from "framer-motion";

import { useTabStore } from "./notes-page";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

// Fisher-Yates (aka Knuth) Shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

interface Question {
  id: string;
  question: string;
  choices: string[]; // Original choices in original order
  answerIndex: number; // Index of the correct answer in the *original* choices array
  shuffledChoices: string[]; // Shuffled choices for display
  selectedAnswer?: string; // The text of the answer the user selected
}

interface QuizPageProps {
  lecture: Lecture & {
    questions: {
      id: string;
      question: string;
      choices: string[];
      answerIndex: number;
    }[];
  };
}

export function QuizPage({ lecture }: QuizPageProps) {
  const { activeTab } = useTabStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(
    null,
  ); // Index in the *shuffled* choices array
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  // Function to initialize or reset the quiz with shuffled questions
  const initializeQuiz = (
    initialQuestions: QuizPageProps["lecture"]["questions"],
  ) => {
    const formattedQuestions = initialQuestions.map((q) => {
      const shuffledChoices = shuffleArray([...q.choices]);
      return {
        ...q,
        shuffledChoices,
      };
    });
    setQuestions(formattedQuestions);
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    setSelectedAnswerIndex(null);
    setIsAnswerSubmitted(false);
    setIsQuizCompleted(false);
  };

  // Initialize quiz on component mount
  useEffect(() => {
    if (lecture.questions && lecture.questions.length > 0) {
      initializeQuiz(lecture.questions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecture.questions]); // Only re-initialize if the base questions change

  function formatRecapTitle() {
    if (!questions || !questions.length) return "";
    const accuracy = (correctAnswers / questions.length) * 100;
    if (accuracy >= 90) return "Excellent job!";
    if (accuracy >= 75) return "Good job!";
    if (accuracy >= 50) return "Not bad!";
    return "Better luck next time!";
  }

  const handleAnswerSelect = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswerIndex(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswerIndex === null || isAnswerSubmitted) return;

    setIsAnswerSubmitted(true);

    const currentQ = questions[currentQuestion];
    // Get the text of the selected answer from the shuffled list
    const selectedAnswerText = currentQ.shuffledChoices[selectedAnswerIndex];
    // Get the text of the correct answer from the original list using the original index
    const correctAnswerText = currentQ.choices[currentQ.answerIndex];

    const isCorrect = selectedAnswerText === correctAnswerText;

    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }

    // Update the selected answer text
    setQuestions((prevQuestions) => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[currentQuestion].selectedAnswer = selectedAnswerText; // Store the selected answer text
      return updatedQuestions;
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion === questions.length - 1) {
      // We're at the last question, mark quiz as completed
      setIsQuizCompleted(true);
    } else {
      // Move to next question
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswerIndex(null);
      setIsAnswerSubmitted(false);
    }
  };

  const handlePlayAgain = () => {
    // Re-initialize the quiz with shuffled questions
    initializeQuiz(lecture.questions ?? []);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle shortcuts when quiz is completed
      if (isQuizCompleted) {
        // If Enter key is pressed on quiz completion screen, restart the quiz
        if (e.key === "Enter") {
          handlePlayAgain();
        }
        return;
      }

      // Only process keyboard shortcuts when the quiz tab is active
      if (activeTab !== "quiz") return;

      // Number keys 1-4 to select answers (if we have 4 or fewer options)
      const numericKey = parseInt(e.key);
      if (
        !isNaN(numericKey) &&
        numericKey >= 1 &&
        numericKey <=
          Math.min(4, questions[currentQuestion]?.shuffledChoices.length || 0)
      ) {
        // Adjust for 0-based index
        handleAnswerSelect(numericKey - 1);
      }

      // Enter key to submit answer or go to next question
      if (e.key === "Enter") {
        if (isAnswerSubmitted) {
          handleNextQuestion();
        } else if (selectedAnswerIndex !== null) {
          handleSubmitAnswer();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeTab,
    currentQuestion,
    isAnswerSubmitted,
    selectedAnswerIndex,
    isQuizCompleted,
    questions,
  ]);

  // Letter options for multiple choice
  const letters = ["A", "B", "C", "D"];

  // Create keyboard shortcut mapping
  const keyboardShortcuts = ["1", "2", "3", "4"];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center space-y-6 py-4">
      {!isQuizCompleted ? (
        // Quiz in progress UI
        <>
          <div className="flex w-full flex-col gap-2 px-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-xl font-medium">
                {currentQuestion}/{questions.length}
              </div>
            </div>
            <Progress
              value={(currentQuestion * 100) / questions.length}
              className="h-2 w-full"
            />
          </div>

          {questions.length > 0 ? (
            <div className="w-full space-y-6 px-4">
              <motion.div
                className="text-2xl font-medium leading-tight"
                key={currentQuestion}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {questions[currentQuestion].question}
              </motion.div>

              <div className="mt-8 flex flex-col gap-4">
                {questions[currentQuestion].shuffledChoices.map(
                  (choice, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={cn(
                        "flex flex-row items-start gap-3 rounded-lg border p-5 text-left transition-all",
                        selectedAnswerIndex === index
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background",
                        // Highlight correct answer after submission
                        isAnswerSubmitted &&
                          choice ===
                            questions[currentQuestion].choices[
                              questions[currentQuestion].answerIndex
                            ] &&
                          "border-green-500 bg-green-500/20",
                        // Highlight incorrect selection after submission
                        isAnswerSubmitted &&
                          selectedAnswerIndex === index &&
                          choice !==
                            questions[currentQuestion].choices[
                              questions[currentQuestion].answerIndex
                            ] &&
                          "border-red-500 bg-red-500/20",
                      )}
                      disabled={isAnswerSubmitted}
                      animate={
                        isAnswerSubmitted &&
                        choice ===
                          questions[currentQuestion].choices[
                            questions[currentQuestion].answerIndex
                          ]
                          ? { scale: [1, 1.02, 1] }
                          : {}
                      }
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border text-base font-medium">
                        {letters[index]}
                      </div>
                      <div className="flex-1 pt-1 font-medium">{choice}</div>
                      {index < 4 && (
                        <div className="ml-2 flex h-6 w-6 items-center justify-center rounded border text-xs text-muted-foreground">
                          {keyboardShortcuts[index]}
                        </div>
                      )}
                    </motion.button>
                  ),
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  onClick={
                    isAnswerSubmitted ? handleNextQuestion : handleSubmitAnswer
                  }
                  disabled={selectedAnswerIndex === null && !isAnswerSubmitted}
                  className="px-8"
                >
                  {isAnswerSubmitted ? "Next Question" : "Submit"}
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded border text-xs">
                    ↵
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            <QuizSkeleton />
          )}
        </>
      ) : (
        // Quiz completion UI
        <motion.div
          className="flex w-full flex-col items-center px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full max-w-md rounded-xl border bg-background p-8 shadow-sm">
            <h2 className="mb-6 text-center text-xl font-semibold">
              {formatRecapTitle()}
            </h2>

            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-center">
              <span className="text-2xl font-semibold">
                {Math.round((correctAnswers / questions.length) * 100)}%
              </span>
            </div>

            <p className="mb-8 text-center text-xl">
              You got <strong>{correctAnswers}</strong> out of{" "}
              <strong>{questions.length}</strong> questions correct.
            </p>

            <Button onClick={handlePlayAgain} className="w-full" size="lg">
              Play Again
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded border text-xs">
                ↵
              </span>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
