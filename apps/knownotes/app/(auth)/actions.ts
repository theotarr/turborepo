"use server";

import { redirect } from "next/navigation";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

export async function createCourse(name: string) {
  const session = await auth();
  if (!session) return redirect("/login");

  return await db.course.create({
    data: {
      name,
      userId: session.user.id,
    },
  });
}

export async function deleteCourse(courseId: string) {
  const session = await auth();
  if (!session) return redirect("/login");

  return await db.course.delete({
    where: {
      id: courseId,
      userId: session.user.id,
    },
  });
}

export async function updateCourse(courseId: string, name: string) {
  const session = await auth();
  if (!session) return redirect("/login");

  return await db.course.update({
    where: {
      id: courseId,
      userId: session.user.id,
    },
    data: {
      name,
    },
  });
}
