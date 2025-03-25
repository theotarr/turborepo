import type { Transcript } from "@acme/validators";

export function formatDeepgramTranscript(result: unknown): Transcript[] {
  console.log("[formatDeepgramTranscript] Starting transcript formatting");

  try {
    if (!result) {
      console.error("[formatDeepgramTranscript] Result is null or undefined");
      return [];
    }

    console.log("[formatDeepgramTranscript] Result type:", typeof result);

    // Safely check the structure
    // @ts-expect-error
    const hasResults = result.results;
    // @ts-expect-error
    const hasChannels = hasResults && Array.isArray(result.results.channels);
    // @ts-expect-error
    const hasAlternatives =
      hasChannels && result.results.channels[0]?.alternatives;

    console.log("[formatDeepgramTranscript] Structure check:", {
      hasResults,
      hasChannels,
      hasAlternatives,
    });

    if (!hasAlternatives) {
      console.error(
        "[formatDeepgramTranscript] Missing expected structure in result",
      );
      return [];
    }

    // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const res = result.results.channels[0].alternatives[0];
    console.log(
      "[formatDeepgramTranscript] Extracted alternative:",
      JSON.stringify(Object.keys(res || {})),
    );

    // Check if paragraphs exist
    if (!res.paragraphs?.paragraphs) {
      console.error(
        "[formatDeepgramTranscript] Missing paragraphs in alternative",
      );

      // Try to extract from words if paragraphs are missing
      if (res.words && Array.isArray(res.words)) {
        console.log("[formatDeepgramTranscript] Falling back to words array");
        return [
          { start: res.words[0]?.start || 0, text: res.transcript || "" },
        ];
      }

      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const paragraphs = res.paragraphs.paragraphs;
    console.log(
      "[formatDeepgramTranscript] Paragraphs found:",
      paragraphs ? paragraphs.length : 0,
    );

    if (!paragraphs || !Array.isArray(paragraphs)) {
      console.error("[formatDeepgramTranscript] Paragraphs is not an array");
      return [];
    }

    const transcript = paragraphs
      .map((p: unknown, index: number) => {
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (!p || typeof p !== "object" || p.start === undefined) {
          console.warn(
            `[formatDeepgramTranscript] Invalid paragraph at index ${index}:`,
            p,
          );
          return { start: 0, text: "" };
        }

        // Get text from sentences if available
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        let paragraphText = p.text || "";
        // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (!paragraphText && p.sentences && Array.isArray(p.sentences)) {
          console.log(
            `[formatDeepgramTranscript] Extracting text from sentences for paragraph ${index}`,
          );
          // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          paragraphText = p.sentences.map((s: any) => s.text).join(" ");
        }

        const entry = {
          // @ts-expect-error eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          start: p.start,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          text: paragraphText,
        };
        return entry;
      })
      .filter((entry: Transcript) => entry.text.trim() !== "");

    console.log(
      "[formatDeepgramTranscript] Final transcript entries:",
      transcript.length,
    );
    if (transcript.length > 0) {
      console.log(
        "[formatDeepgramTranscript] Sample entry:",
        JSON.stringify(transcript[0]),
      );
    }

    return transcript;
  } catch (error) {
    console.error("[formatDeepgramTranscript] Error during formatting:", error);
    return [];
  }
}
