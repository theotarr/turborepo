"use server";

import { redirect } from "next/navigation";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

export async function updateLecture({
  lectureId,
  title,
  notes,
  enhancedNotes,
  courseId,
}: {
  lectureId: string;
  title?: string | undefined;
  notes?: string | undefined;
  enhancedNotes?: string | undefined;
  courseId?: string | undefined;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  if (courseId) {
    if (!(await verifyCurrentUserHasAccessToCourse(courseId))) {
      throw new Error("User does not have access to the course.");
    }
  }

  const lecture = await db.lecture.update({
    where: {
      id: lectureId,
      userId: session.user.id,
    },
    data: {
      title,
      ...(notes && { notes: JSON.parse(notes) }),
      ...(enhancedNotes && { enhancedNotes: JSON.parse(enhancedNotes) }),
      ...(courseId && { courseId }),
    },
  });
  if (!lecture) throw new Error("Error updating lecture.");

  return lecture;
}

export async function deleteLecture(lectureId: string) {
  const session = await auth();
  if (!session) redirect("/login");

  const lecture = await db.lecture.delete({
    where: {
      id: lectureId,
      userId: session.user.id,
    },
  });
  if (!lecture) throw new Error("Error deleting lecture.");

  return lecture;
}

export async function verifyCurrentUserHasAccessToLecture(lectureId: string) {
  const session = await auth();
  if (!session) redirect("/login");

  const lecture = await db.lecture.findUnique({
    where: {
      id: lectureId,
      userId: session.user.id,
    },
  });
  if (!lecture) throw new Error("Error verifying lecture access.");

  return true;
}

export async function verifyCurrentUserHasAccessToCourse(courseId: string) {
  const session = await auth();
  if (!session) redirect("/login");

  const course = await db.course.findUnique({
    where: {
      id: courseId,
      userId: session.user.id,
    },
  });
  if (!course) throw new Error("Error verifying course access.");

  return true;
}
