import type { Transcript } from "@acme/validators";

export function formatDeepgramTranscript(result: unknown): Transcript[] {
  // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const res = result.results.channels[0].alternatives[0];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const paragraphs = res.paragraphs.paragraphs;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const transcript = paragraphs.map((p: unknown) => {
    return {
      // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      start: p.start,
      // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      text: p.text,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return transcript;
}
