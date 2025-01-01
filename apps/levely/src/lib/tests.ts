import type { Subject } from "~/types/types";

export const habitQuestions = [
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
];

export const focusQuestions = [
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
    options: ["Very easily", "Somewhat easily", "Not easily", "Never"],
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
];

export const sections = [
  { name: "Habits", href: "/retake/habits", questions: habitQuestions },
  { name: "Memorization", href: "/retake/memorization", questions: [] },
  { name: "Focus", href: "/retake/focus", questions: focusQuestions },
  { name: "Reading", href: "/retake/reading", questions: [] },
  { name: "Grades", href: "/retake/grades", questions: [] },
];

export const defaultSubjects = [
  { id: 0, name: "Math", grade: "A" },
] as Subject[];
