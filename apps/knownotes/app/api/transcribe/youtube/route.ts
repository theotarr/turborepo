import { db } from "@/lib/db";
import { embedTranscripts } from "@/lib/embeddings";
// import { getUserSubscriptionPlan } from "@/lib/subscription";
import { getVideoId, getVideoInfo, getVideoTranscript } from "@/lib/youtube";
import { LectureType } from "@prisma/client";
import { z } from "zod";

import { auth } from "@acme/auth";

export const maxDuration = 60; // 1 minute
const routePostSchema = z.object({
  videoUrl: z.string(),
  courseId: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const body = routePostSchema.parse(json);
  const { videoUrl, courseId } = body;

  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 403 });

  // const subscription = await getUserSubscriptionPlan(session.user.id);
  // if (!subscription.isPro)
  //   return new Response(JSON.stringify("Pro plan required"), {
  //     status: 403,
  //   });

  if (courseId) {
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
    });
    if (!course || course.userId !== session.user.id)
      return new Response(JSON.stringify("Course not found"), { status: 404 });
  }

  const videoId = getVideoId(videoUrl);
  if (!videoId)
    return new Response(JSON.stringify("Invalid video URL"), { status: 400 });

  console.log(`Scraping video ${videoId}...`);
  const { title, transcript } = await getVideoTranscript(videoId);
  if (!transcript)
    return new Response(JSON.stringify("Failed to fetch transcript"), {
      status: 500,
    });

  // Create the lecture in the DB.
  const data = {
    type: "YOUTUBE" as LectureType,
    title: title ?? "Youtube Video",
    transcript: (transcript as any) ?? undefined,
    userId: session.user.id as string,
    ...(courseId ? { courseId } : {}), // TODO: Look into why not providing the `courseId` will cause the course to be set to null and throw an error.
    youtubeVideoId: videoId as string,
  };
  const lecture = await db.lecture.create({ data });
  if (!lecture)
    return new Response(JSON.stringify("Failed to create lecture"), {
      status: 500,
    });

  // Embed the transript to make is searchable.
  await embedTranscripts(transcript, lecture.id, courseId);

  // Update the lecture with the embedded transcript IDs.
  await db.lecture.update({
    where: {
      id: lecture.id,
    },
    data: {
      transcript: transcript as any,
    },
  });

  return new Response(JSON.stringify({ id: lecture.id }));
}
