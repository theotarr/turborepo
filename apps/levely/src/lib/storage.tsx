import * as SecureStore from "expo-secure-store";

import type { PersonalInfo, Question, Subject } from "~/types/types";

const PERSONAL_INFO_KEY = "personal_info";
const HABITS_KEY = "habits";
const MEMORY_KEY = "memory";
const FOCUS_KEY = "focus";
const READING_KEY = "reading";
const GRADES_KEY = "grades";
const ONBOARDING_COMPLETE_KEY = "onboarding_complete";

// Personal Info
export async function setPersonalInfo(info: PersonalInfo) {
  const personalInfo = JSON.stringify(info);
  await SecureStore.setItemAsync(PERSONAL_INFO_KEY, personalInfo);
}
export async function getPersonalInfo(): Promise<PersonalInfo | null> {
  const info = await SecureStore.getItemAsync(PERSONAL_INFO_KEY);
  if (!info) return null;
  return JSON.parse(info) as PersonalInfo;
}

// Onboarding
export async function getOnboardingComplete(): Promise<boolean> {
  const complete = await SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY);
  return complete === "true";
}
export async function setOnboardingComplete() {
  await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, "true");
}

// Habits questions
export async function setHabits(habits: Question[]) {
  const habitsString = JSON.stringify(habits);
  await SecureStore.setItemAsync(HABITS_KEY, habitsString);
}
export async function getHabits(): Promise<Question[]> {
  const habits = await SecureStore.getItemAsync(HABITS_KEY);
  if (!habits) return [];
  return JSON.parse(habits) as Question[];
}

// Focus questions
export async function setFocus(focus: Question[]) {
  const focusString = JSON.stringify(focus);
  await SecureStore.setItemAsync(FOCUS_KEY, focusString);
}
export async function getFocus(): Promise<Question[]> {
  const focus = await SecureStore.getItemAsync(FOCUS_KEY);
  if (!focus) return [];
  return JSON.parse(focus) as Question[];
}

// Grades
export async function setGrades(grades: Subject[]) {
  const gradesString = JSON.stringify(grades);
  await SecureStore.setItemAsync(GRADES_KEY, gradesString);
}
export async function getGrades(): Promise<Subject[]> {
  const grades = await SecureStore.getItemAsync(GRADES_KEY);
  if (!grades) return [];
  return JSON.parse(grades) as Subject[];
}
