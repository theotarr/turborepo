"use server";

import { redirect } from "next/navigation";
import { LectureType } from "@prisma/client";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

export async function createLecture(
  courseId?: string,
  type: LectureType = "LIVE",
): Promise<string> {
  const session = await auth();
  if (!session) redirect("/login");

  const lecture = await db.lecture.create({
    data: {
      type,
      title: "Untitled Lecture",
      userId: session.user.id,
      courseId: courseId || null,
    },
  });

  if (!lecture) throw new Error("There was an error creating the lecture.");

  return lecture.id;
}
