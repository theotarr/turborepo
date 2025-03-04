import { redirect } from "next/navigation";
import { YoutubeGenerator } from "@/components/youtube-generator";
import { db } from "@/lib/db";
import { LectureType } from "@prisma/client";

import { getVideoId, getVideoTranscript } from "@acme/api";
import { auth } from "@acme/auth";

interface YoutubeCatchAllProps {
  params: {
    url: string[];
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

// Reconstruct the full URL from params and search params
const reconstructUrl = (
  params: { url: string[] },
  searchParams: { [key: string]: string | string[] | undefined },
) => {
  // Start with the base path from params
  let url = `https://${params.url.join("/")}`;

  // Add search parameters if they exist
  if (searchParams && Object.keys(searchParams).length > 0) {
    const urlObj = new URL(url);

    // Iterate through all search parameters and add them to the URL
    Object.entries(searchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // Handle array values (multiple parameters with the same name)
        value.forEach((v) => urlObj.searchParams.append(key, v));
      } else if (value !== undefined) {
        // Handle single values
        urlObj.searchParams.append(key, value);
      }
    });

    url = urlObj.toString();
  }

  return url;
};

export default async function YoutubeCatchAll({
  params,
  searchParams,
}: YoutubeCatchAllProps) {
  const session = await auth();
  if (!session) return redirect("/login");

  const url = reconstructUrl(params, searchParams);
  console.log(`Reconstructed URL: ${url}`);

  const videoId = getVideoId(url);
  if (!videoId) {
    console.log(`Failed to extract video ID from: ${url}`);
    return redirect("/");
  }
  console.log(`Valid YouTube video ID found: ${videoId}`);

  return <YoutubeGenerator videoUrl={url} />;
}
