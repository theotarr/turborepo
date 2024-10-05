"use server"

import { redirect } from "next/navigation"
import { auth } from "@acme/auth"

import { db } from "@/lib/db"

export async function createCourse(courseName: string) {
  const session = await auth()
  if (!session) return redirect("/login")

  return await db.course.create({
    data: {
      name: courseName,
      userId: session.user.id,
    },
  })
}

export async function registeredInPastMinute() {
  const session = await auth()
  if (!session) return redirect("/login")

  // If the current user was created before 1 hour ago (arbitrary time), they are considered a new user.
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
  })
  if (!user) return redirect("/login")

  return new Date(user.createdAt) < new Date(Date.now() - 1000 * 60) // 1 minute ago
}
