import type { Transcript } from "@acme/validators";

// Define a type for the expected Deepgram response structure
interface DeepgramResult {
  results?: {
    channels?: {
      alternatives?: {
        paragraphs?: {
          paragraphs?: {
            start: number;
            text?: string;
            sentences?: { text: string }[];
          }[];
        };
        words?: { start: number }[];
        transcript?: string;
      }[];
    }[];
  };
}

export function formatDeepgramTranscript(result: unknown): Transcript[] {
  console.log("[formatDeepgramTranscript] Starting transcript formatting");

  try {
    if (!result) {
      console.error("[formatDeepgramTranscript] Result is null or undefined");
      return [];
    }

    console.log("[formatDeepgramTranscript] Result type:", typeof result);

    // Cast the unknown result to our expected structure
    const typedResult = result as DeepgramResult;

    // Safely check the structure
    const hasResults = !!typedResult.results;
    const hasChannels =
      hasResults && Array.isArray(typedResult.results?.channels);
    const hasAlternatives =
      hasChannels &&
      typedResult.results?.channels?.[0]?.alternatives !== undefined;

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

    const alternative = typedResult.results?.channels?.[0]?.alternatives?.[0];
    if (!alternative) {
      console.error("[formatDeepgramTranscript] Could not extract alternative");
      return [];
    }

    console.log(
      "[formatDeepgramTranscript] Extracted alternative:",
      JSON.stringify(Object.keys(alternative)),
    );

    // Check if paragraphs exist
    if (!alternative.paragraphs?.paragraphs) {
      console.error(
        "[formatDeepgramTranscript] Missing paragraphs in alternative",
      );

      // Try to extract from words if paragraphs are missing
      if (alternative.words && Array.isArray(alternative.words)) {
        console.log("[formatDeepgramTranscript] Falling back to words array");
        return [
          {
            start: alternative.words[0]?.start ?? 0,
            text: alternative.transcript ?? "",
          },
        ];
      }

      return [];
    }

    const paragraphs = alternative.paragraphs.paragraphs;
    console.log(
      "[formatDeepgramTranscript] Paragraphs found:",
      paragraphs.length,
    );

    if (!Array.isArray(paragraphs)) {
      console.error("[formatDeepgramTranscript] Paragraphs is not an array");
      return [];
    }

    const transcript = paragraphs
      .map((p, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!p || typeof p !== "object" || p.start === undefined) {
          console.warn(
            `[formatDeepgramTranscript] Invalid paragraph at index ${index}:`,
            p,
          );
          return { start: 0, text: "" };
        }

        // Get text from sentences if available
        let paragraphText = p.text ?? "";
        if (!paragraphText && p.sentences && Array.isArray(p.sentences)) {
          console.log(
            `[formatDeepgramTranscript] Extracting text from sentences for paragraph ${index}`,
          );
          paragraphText = p.sentences.map((s) => s.text).join(" ");
        }

        return {
          start: p.start,
          text: paragraphText,
        };
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
