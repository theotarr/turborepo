import { parse } from "node-html-parser";

const RE_PATH = /v|e(?:mbed)?|shorts/;

const RE_CAPTION_TRACKS = /"captionTracks":\s?(\[.*?\])/;

const ID_LENGTH = 11;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)";

export interface TranscriptResponse {
  text: string;
  duration: number;
  start: number;
}

export interface TranscriptConfig {
  /**
   * Locale code
   * @example en, es, hk, uk
   */
  lang?: string;
}

export class YoutubeTranscriptError extends Error {
  constructor(message: string) {
    super(`[YoutubeTranscript] ${message}`);
  }
}

/**
 * Fetch transcript from Youtube Video
 * @param {string} videoUrlOrId - Video url or identifier
 * @param {TranscriptConfig} [config]
 * @return {Promise<TranscriptResponse[]>} - If locale available, the localized transcription or default or null.
 */
export const fetchTranscript = async (
  videoUrlOrId: string,
  config: TranscriptConfig = {},
): Promise<TranscriptResponse[] | undefined> => {
  try {
    const videoId = getVideoId(videoUrlOrId);

    if (!videoId) {
      throw new Error("Invalid Youtube video identifier.");
    }

    const url = await getTranscriptUrl(videoId, config?.lang ?? "en");

    if (!url) {
      console.warn("Warning: no URL found for video", videoId);
      return undefined;
    }

    return await getTranscript(url);
  } catch (err) {
    throw new YoutubeTranscriptError(err);
  }
};

const getTranscriptUrl = async (videoId: string, lang?: string) => {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
  const body = await response.text();

  return getCaptionTrack(body, lang);
};

const getTranscript = async (url: string): Promise<TranscriptResponse[]> => {
  const response = await fetch(url);
  const body = await response.text();
  const parsed = parse(body);
  const transcript = parsed.getElementsByTagName("text").map((e) => {
    const attributes = e.attributes;

    return {
      text: e.textContent,
      start: parseFloat(attributes.start),
      duration: parseFloat(attributes.dur),
    };
  });

  return transcript;
};

export const getVideoInfo = async (videoId: string) => {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
  const body = await response.text();
  const parsed = parse(body);
  let title = parsed.querySelector("title")?.text || "Untitled Youtube Video";
  title = title.substring(0, title.indexOf(" - YouTube"));

  return title;
};

/**
 * Extract caption track URL from raw HTML string.
 * @param {string} html - The raw HTML string.
 * @param {string} [lang] - The language code to filter the caption tracks by. Default is undefined.
 * @returns {string|null} - The URL of the caption track, or null if not found or an error occurred.
 */
const getCaptionTrack = (html: string, lang?: string): string | null => {
  try {
    const captionTracks = JSON.parse(
      html.match(RE_CAPTION_TRACKS)?.[1] ?? "[]",
    );

    return (
      (
        (lang && captionTracks.find((e) => e.languageCode.includes(lang))) ||
        captionTracks[0]
      )?.baseUrl ?? null
    );
  } catch (err) {
    console.error("Error parsing caption tracks", err);
    return null;
  }
};

/**
 * Get video id from path or search params
 * @param videoId - video url or video id
 * @returns {string|null} - the id of null
 */
export const getVideoId = (videoUrlOrId: string): string | null => {
  if (!videoUrlOrId) {
    return null;
  }

  if (videoUrlOrId.length === ID_LENGTH) {
    return videoUrlOrId;
  }

  try {
    const url = new URL(videoUrlOrId);
    const segments = url.pathname.split("/");

    if (segments[1]?.length === ID_LENGTH) {
      return segments[1];
    }

    return (
      (RE_PATH.test(segments[1]) ? segments[2] : url.searchParams.get("v")) ||
      null
    );
  } catch (err) {
    return null;
  }
};
