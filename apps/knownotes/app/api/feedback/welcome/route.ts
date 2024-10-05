import { db } from "@/lib/db";
import { UserSignUpQuestionType } from "@prisma/client";
import * as z from "zod";

import { auth } from "@acme/auth";

const routeContextSchema = z.object({
  questions: z.array(
    z.object({
      questionType: z.custom<UserSignUpQuestionType>(),
      answer: z.string(),
    }),
  ),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("User not found", { status: 404 });

  const json = await req.json();
  const body = routeContextSchema.parse(json);
  const { questions } = body;

  await db.userSignUpQuestion.createMany({
    data: questions.map((question) => ({
      userId: session.user.id,
      questionType: question.questionType,
      answer: question.answer,
    })),
  });

  return new Response("OK");
}
