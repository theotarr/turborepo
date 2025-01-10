import { env } from "@/env";
import { Transcript } from "@/types";
import { parse } from "node-html-parser";

const RE_PATH = /v|e(?:mbed)?|shorts/;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)";
const ID_LENGTH = 11;

/**
 * Get video id from path or search params
 * @param videoUrlOrId - video url or video id
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

/**
 * Fetch video info for a YouTube video
 * @param videoId - The YouTube video ID
 * @returns {Promise<string>} The title of the video
 */
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
 * Fetch captions for a YouTube video using Apify API
 * @param videoId - The YouTube video ID
 * @returns {Promise<Transcript[]>} Array of transcript segments with text and timestamps
 */
export async function getVideoTranscript(
  videoId: string,
): Promise<Transcript[]> {
  // TODO: Figure out why the Apify Client Library doesn't work, but the API does.
  try {
    const actorId = "1s7eXiaukVuOr4Ueg"; // Youtube Captions Actor
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.APIFY_API_TOKEN}`,
        },
        body: JSON.stringify({
          outputFormat: "captions",
          urls: [`https://www.youtube.com/watch?v=${videoId}`],
          maxRetries: 6,
          proxyOptions: {
            useApifyProxy: true,
            apifyProxyGroups: ["BUYPROXIES94952"],
          },
        }),
      },
    );

    if (!response.ok) {
      console.error(response);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const items = await response.json();

    if (!items || items.length === 0) {
      throw new Error("No captions found for this video");
    }

    // Transform the Apify response into our Transcript format
    const transcript = {
      text: items[0].captions.join(" "),
      start: 0,
    };
    return [transcript];
  } catch (error) {
    console.error("Failed to fetch transcript:", error);
    throw new Error("Failed to fetch video transcript");
  }
}
