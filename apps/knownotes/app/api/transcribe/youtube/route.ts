import { db } from "@/lib/db";
import { embedTranscripts } from "@/lib/embeddings";
import { z } from "zod";

import { auth } from "@acme/auth";

export const maxDuration = 60; // 1 minute
const routePostSchema = z.object({
  videoId: z.string(),
  title: z.string().optional(),
  transcript: z.array(
    z.object({
      start: z.number(),
      text: z.string(),
    }),
  ),
  courseId: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const body = routePostSchema.parse(json);
  const { videoId, transcript, title, courseId } = body;

  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 403 });

  if (courseId) {
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
    });
    if (!course || course.userId !== session.user.id)
      return new Response(JSON.stringify("Course not found"), { status: 404 });
  }

  // console.log(`Fetching Youtube video (${videoUrl})...`);
  // const id = getVideoId(videoUrl);
  // if (!id)
  //   return new Response(JSON.stringify("Invalid video URL"), { status: 400 });

  // console.log("Fetch video title...");
  // const title = await getVideoInfo(id);

  // console.log(`Fetching transcript for video ${id}...`);
  // let transcript = await fetchTranscript(id);

  // if (!transcript) {
  //   // return new Response(JSON.stringify("No transcript found"), { status: 404 });

  //   // If the video has no transcript, we will transcribe the audio instead.
  //   console.log(`Downloading audio for video ${id}...`);
  //   const filePath =
  //     process.env.NODE_ENV === "development"
  //       ? `${process.cwd()}/${id}`
  //       : `/tmp/${id}`;
  //   const stream = fs.createWriteStream(filePath);

  //   const getVideo = new Promise((resolve, reject) => {
  //     const fetch = ytdl(`https://www.youtube.com/watch?v=${id}`, {
  //       filter: "audioonly",
  //       quality: "highestaudio",
  //     });
  //     fetch.pipe(stream);
  //     fetch.on("end", async () => {
  //       try {
  //         console.log(`Transcribing audio for video ${id}...`);
  //         const { result, error } =
  //           await deepgram.listen.prerecorded.transcribeFile(
  //             fs.readFileSync(filePath),
  //             {
  //               model: "nova-2",
  //               punctuate: true,
  //               smart_formatting: true,
  //               paragraphs: true,
  //               tag: ["knownotes-youtube-upload"],
  //             },
  //           );
  //         if (error) throw new Error(error.message);

  //         // @ts-ignore
  //         transcript =
  //           result.results.channels[0].alternatives[0].paragraphs?.paragraphs?.map(
  //             (p) => {
  //               const paragraphText = p.sentences?.map((s) => s.text).join(" ");
  //               return {
  //                 start: p.start,
  //                 text: paragraphText,
  //               };
  //             },
  //           ) ?? [];

  //         resolve({});
  //       } catch (error) {
  //         if (error instanceof Error) {
  //           reject(error.message);
  //           console.error(error.message);
  //         }
  //       }
  //     });
  //   });

  //   // Delete the mp3 file after the transcription is done.
  //   await getVideo.then(() => fs.unlink(filePath, () => {}));
  // }

  // Create the lecture in the DB.
  const lecture = await db.lecture.create({
    data: {
      type: "YOUTUBE",
      title: title ?? "Youtube Video",
      transcript: (transcript as any) ?? undefined,
      userId: session.user.id,
      courseId: courseId ?? undefined, // TODO: Look into why not providing the `courseId` will cause the course to be set to null and throw an error.
      youtubeVideoId: videoId,
    },
  });
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
