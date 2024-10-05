import { db } from "@/lib/db";
import { embedTranscripts, shouldEmbedTranscripts } from "@/lib/embeddings";
import { Transcript } from "@/types";
import * as z from "zod";

import { auth } from "@acme/auth";

const routeContextSchema = z.object({
  params: z.object({
    lectureId: z.string(),
  }),
});

const lectureTranscriptPatchSchema = z.object({
  transcript: z.custom<Transcript[]>().optional(),
});

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>,
) {
  const session = await auth();

  try {
    const { params } = routeContextSchema.parse(context);

    // Get the request body and validate it.
    const json = await req.json();
    const body = lectureTranscriptPatchSchema.parse(json);
    const { transcript } = body;

    // Check if the user has access to this lecture.
    const lecture = await db.lecture.findUnique({
      where: {
        id: params.lectureId,
      },
    });
    if (!lecture) return new Response(null, { status: 404 });
    if (lecture.userId !== session?.user?.id)
      return new Response(null, { status: 403 });

    // Embed the transcripts if there are any new ones and they are at least 500 characters in length.
    // Find the index of the last embedded transcript from the DB. This is used to determine which new transcripts to embed.
    let lastEmbeddedTranscriptIndex = -1;
    for (let i = 0; i < lecture.transcript?.length; i++) {
      if ((lecture.transcript[i] as any as Transcript).embeddingIds)
        lastEmbeddedTranscriptIndex = i;
      else break;
    }

    // If there are new transcripts, embed them.
    const embededTranscripts = lecture.transcript?.slice(
      0,
      lastEmbeddedTranscriptIndex + 1,
    );
    const unembededTranscripts = transcript?.slice(
      lastEmbeddedTranscriptIndex + 1,
    );
    const shouldEmbed =
      unembededTranscripts && shouldEmbedTranscripts(unembededTranscripts);

    if (shouldEmbed) {
      const embeddingDocumentIds = shouldEmbed
        ? await embedTranscripts(
            unembededTranscripts,
            params.lectureId,
            lecture.courseId ?? undefined,
          )
        : [];

      // Add the embedding ids to the new transcript.
      for (const t of unembededTranscripts) {
        t.embeddingIds = embeddingDocumentIds;
      }
    }

    // Combine the old and new transcripts.
    const combinedTranscripts = [
      ...(embededTranscripts ?? []),
      ...(unembededTranscripts ?? []),
    ];

    // Update the lecture.
    await db.lecture.update({
      where: {
        id: params.lectureId,
      },
      data: {
        transcript: combinedTranscripts as any, // If combinedTranscripts is undefined, do not update the transcript in the DB.
      },
    });

    return new Response(
      JSON.stringify({
        message: "Successfully updated the lecture transcript.",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}
