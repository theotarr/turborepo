import { db } from "@/lib/db";
import { Transcript } from "@/types";
import * as z from "zod";

import { auth } from "@acme/auth";

const routePostSchema = z.object({
  lectureId: z.string(),
  transcript: z.custom<Transcript[]>(),
});

export async function POST(req: Request) {
  // Get the request body and validate it.
  const json = await req.json();
  const body = routePostSchema.parse(json);
  const { lectureId, transcript } = body;

  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 403 });

  const { user } = session;

  // if the lecture exists, update the transcript
  const lecture = await db.lecture.upsert({
    where: {
      id: lectureId,
    },
    create: {
      id: lectureId,
      title: "Untitled Lecture",
      transcript: transcript as any,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
    update: {
      transcript: transcript as any,
    },
  });

  return new Response(JSON.stringify({ lecture }));
}
