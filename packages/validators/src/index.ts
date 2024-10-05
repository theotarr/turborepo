import { z } from "zod";

export interface Transcript {
  text: string;
  start: number; // seconds from the beginning of the audio
  embeddingIds?: string[]; // the id of the embedding in the database
}

export function formatTranscript(transcript: Transcript[]): string {
  return `Transcript:\n${transcript
    .map(
      (t) =>
        `${new Date(t.start * 1000).toISOString().substr(11, 8)} ${t.text}`,
    )
    .join("\n")}`;
}

export const CreateLectureSchema = z.object({
  courseId: z.string().optional(),
});
