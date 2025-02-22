"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";

import { auth } from "@acme/auth";

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
