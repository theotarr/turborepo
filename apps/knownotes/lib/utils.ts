import { env } from "@/env";
import { Transcript } from "@/types";
import { Message } from "ai";
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number, abbreviate = false): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: abbreviate ? "short" : "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function absoluteUrl(path: string) {
  return `${env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function getDateAndTime() {
  return new Date().toJSON().slice(0, 19).replace("T", " "); // YYYY-MM-DD HH:MM:SS
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch (e) {
    return null;
  }
}

export function formatTranscript(transcript: Transcript[]): string {
  return `Transcript:\n${transcript
    .map(
      (t) =>
        `${new Date(t.start * 1000).toISOString().substr(11, 8) ?? "0:00:00"} ${
          t.text
        }`,
    )
    .join("\n")}`;
}

export function escapeMarkdown(text: string) {
  return text.replace(/([#*_{}[\]()`~>#+-.!|])/g, "\\$1");
}

export function formatAIMessages(messages: Message[]) {
  return messages.map((m) => ({
    id: m.id,
    role: m.role.toLowerCase() as
      | "function"
      | "data"
      | "system"
      | "user"
      | "assistant"
      | "tool",
    content: m.content,
  }));
}

export function retrieveYoutubeVideoId(videoId: string) {
  if (videoId.length === 11) {
    return videoId;
  }
  const matchId = videoId.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
  );
  if (matchId && matchId.length) {
    return matchId[1];
  }
  throw new Error("Impossible to retrieve Youtube video ID.");
}

export function formatLectureType(type: string) {
  return type
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
