"use server";

import { redirect } from "next/navigation";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

export async function createCourse(courseName: string) {
  const session = await auth();
  if (!session) return redirect("/login");

  return await db.course.create({
    data: {
      name: courseName,
      userId: session.user.id,
    },
  });
}
