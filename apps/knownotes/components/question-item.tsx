"use client"

import React from "react"
import { useEffect, useMemo, useState } from "react"
import { Skeleton } from "./ui/skeleton"

interface QuestionProps {
  question: {
    question: string
    choices: string[]
    answerIndex: number
    selectedAnswer?: string
  }
  onNext: ({
    isCorrect,
    selectedAnswer,
  }: {
    isCorrect: boolean
    selectedAnswer: string
  }) => void
}

export function QuestionItem({ question, onNext }: QuestionProps) {
  const shuffled = useMemo(() => {
    const choices = [...question.choices]
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[choices[i], choices[j]] = [choices[j], choices[i]]
    }
    return choices
  }, [question.choices])
  const [answer, setAnswer] = useState("")

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function isCorrectAnswer(answer: string) {
    return answer === question.choices[question.answerIndex]
  }

  useEffect(() => {
    // Check if the selected answer has changed and if it is correct
    if (!answer) return

    const interval = setInterval(() => {
      onNext({
        isCorrect: isCorrectAnswer(answer),
        selectedAnswer: answer,
      })
      setAnswer("")
    }, 1000)
    return () => clearInterval(interval)
  }, [answer, isCorrectAnswer, onNext, question])

  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
      <div className="font-medium leading-tight tracking-tight sm:text-xl md:text-2xl lg:text-3xl">
        {question.question}
      </div>
      <div className="flex flex-col gap-5">
        {shuffled.map((option) => (
          <button
            key={option}
            className={`rounded-lg border bg-background p-5 transition-all ${
              answer && answer === option
                ? isCorrectAnswer(answer)
                  ? "bg-primary"
                  : "bg-destructive"
                : answer && isCorrectAnswer(option)
                ? "bg-primary"
                : "bg-background"
            }`}
            onClick={() => setAnswer(option)}
          >
            <p
              dangerouslySetInnerHTML={{ __html: option }}
              className="font-medium"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

QuestionItem.Skeleton = function QuestionItemSkeleton() {
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
      <div className="font-medium leading-tight tracking-tight sm:text-xl md:text-2xl lg:text-3xl">
        <Skeleton className="h-16 w-[350px] rounded" />
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-12 w-[350px]" />
        <Skeleton className="h-12 w-[350px]" />
        <Skeleton className="h-12 w-[350px]" />
        <Skeleton className="h-12 w-[350px]" />
      </div>
    </div>
  )
}
