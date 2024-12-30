export interface PersonalInfo {
  name: string;
  location: string;
  major: string;
  school: string;
}

export interface Question {
  question: string;
  answer: string;
}

export interface Subject {
  id: string | number;
  name: string;
  grade: Grade;
}
export type Grade =
  | "F"
  | "D-"
  | "D"
  | "D+"
  | "C-"
  | "C"
  | "C+"
  | "B-"
  | "B"
  | "B+"
  | "A-"
  | "A"
  | "A+";
