import { auth } from "@acme/auth"
import * as z from "zod"

import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) {
    return new Response("Unauthorized", { status: 403 })
  }
  const { user } = session
  const body = await req.json()
  const courseSchema = z.object({
    name: z.string().max(128),
  })
  const { name } = courseSchema.parse(body)
  const course = await db.course.create({
    data: {
      name,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
  })

  return new Response(JSON.stringify({ courseId: course.id }))
}
