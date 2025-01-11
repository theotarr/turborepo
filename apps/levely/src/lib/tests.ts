import type { Subject } from "~/types/types";

export const habitQuestions = [
  {
    question: "How much do you study every week?",
    options: [
      "Less than 2 hours",
      "2-4 hours",
      "4-6 hours",
      "More than 6 hours",
    ],
  },
  {
    question: "How much time do you spend on your phone daily?",
    options: [
      "Less than 2 hours",
      "2-4 hours",
      "4-6 hours",
      "More than 6 hours",
    ],
  },
  {
    question: "How many hours do you work out a week?",
    options: ["None", "1-3 hours", "4-6 hours", "More than 6 hours"],
  },
  {
    question: "How many hours do you sleep per night?",
    options: [
      "Less than 5 hours",
      "5-6 hours",
      "7-8 hours",
      "More than 8 hours",
    ],
  },
  {
    question: "Do you regularly postpone tasks to the next day?",
    options: ["Often", "Sometimes", "Rarely", "Never"],
  },
];

export const focusQuestions = [
  {
    question: "How often do you work without getting distracted?",
    options: ["Often", "Sometimes", "Rarely", "Never"],
  },
  {
    question: "How long can you stay  focused on a single task?",
    options: [
      "Less than 10 minutes",
      "10-30 minutes",
      "30-60 minutes",
      "More than 60 minutes",
    ],
  },
  {
    question: "How easily do you lose focus on a challenging task?",
    options: ["Very easily", "Somewhat easily", "Rarely", "Never"],
  },
  {
    question: "How well do you manage stress while working?",
    options: ["Not at all", "Somewhat", "Well", "Very well"],
  },
  {
    question: "What percentage of your to-dos do you finish in a day?",
    options: ["0-25%", "25-50%", "50-75%", "75-100%"],
  },
  {
    question: "Do you regularly postpone tasks to the next day?",
    options: ["Often", "Sometimes", "Rarely", "Never"],
  },
  {
    question: "Do you take breaks to recharge during the day?",
    options: ["Often", "Sometimes", "Rarely", "Never"],
  },
];

export const readingPassgage = `It was 2 a.m., and Alex was deep in the trenches of TikTok. The For You page was a vibe—chaotic edits, thirst traps, and those oddly satisfying slime videos. Just as Alex was about to log off (for real this time), a video about 'manifesting your dream life' popped up. With zero hesitation, he grabbed his emotional-support water bottle and started making a 'vision board' on Canva. By 3 a.m., the board was all ✨aesthetic✨, filled with designer fits, private jets, and 'main character energy' quotes. Exhausted but feeling iconic, Alex finally went to sleep... only to wake up at noon and realize he’d forgotten to turn in his essay. The dream life could wait.`;
export const readingQuestions = [
  {
    question: "What was Alex doing at 2 a.m.?",
    options: ["Writing an essay", "Scrolling TikTok", "Watching Netflix"],
    correctAnswer: "Scrolling TikTok",
  },
  {
    question: "What kind of video inspired Alex to start a vision board?",
    options: [
      "A slime-making tutorial",
      "A video about manifesting your dream life",
      "A dance challenge",
    ],
    correctAnswer: "A video about manifesting your dream life",
  },
  {
    question: "What did Alex use to make his vision board?",
    options: ["A Pinterest board", "A sketchbook", "Canva"],
    correctAnswer: "Canva",
  },
  {
    question: "What time did Alex finally go to sleep?",
    options: ["Midnight", "3 a.m.", "Noon"],
    correctAnswer: "3 a.m.",
  },
  {
    question: "What did Alex forget to do the next day?",
    options: [
      "Submit his essay",
      "Check his TikTok likes",
      "Update his vision board",
    ],
    correctAnswer: "Submit his essay",
  },
];

export const sections = [
  { name: "Habits", href: "/retake/habits", questions: habitQuestions },
  { name: "Memorization", href: "/retake/memorization", questions: [] },
  { name: "Focus", href: "/retake/focus", questions: focusQuestions },
  { name: "Grades", href: "/retake/grades", questions: [] },
];

export const defaultSubjects = [
  { id: 0, name: "Math", grade: "A" },
] as Subject[];

export function calcReadingSpeed(text: string, timeElapsed: number) {
  return Math.round((text.split(" ").length / (timeElapsed / 1000)) * 60);
}

export function calcReadingScore(wpm: number, memoryAccuracy: number) {
  // Divide by 500 to make it easier to get a high score. Since we want the other scores to be lower relatively.
  const readingScore = Math.round((wpm / 500) * memoryAccuracy);
  return readingScore >= 100 ? 99 : readingScore; // Limit to 99.
}

export function getReadingSpeedPercentile(wpm: number): string {
  if (wpm >= 700) return "You're in the top 1% of readers!";
  if (wpm >= 500) return "You're in the top 5% of readers!";
  if (wpm >= 400) return "You're in the top 15% of readers!";
  if (wpm >= 300) return "You're in the top 30% of readers!";
  if (wpm >= 250) return "You're reading at an average speed";
  if (wpm >= 200) return "You're reading slightly below average";
  return "You may want to work on improving your reading speed";
}

export function calcMemoryScore(memoryAccuracy: number, readingScore: number) {
  const memoryScore = Math.round((memoryAccuracy / 100) * readingScore);
  return memoryScore >= 100 ? 99 : memoryScore; // Limit to 99.
}
