import { auth } from "@acme/auth"
import { Prisma } from "@prisma/client"
import * as z from "zod"

import { db } from "@/lib/db"
import { verifyCurrentUserHasAccessToCourse } from "@/lib/lecture/actions"

const routeContextSchema = z.object({
  params: z.object({
    lectureId: z.string(),
  }),
})

const lecturePatchSchema = z.object({
  courseId: z.string().optional(),
  title: z.string().optional(),
})

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  const session = await auth()

  try {
    const { params } = routeContextSchema.parse(context)
    const { lectureId } = params

    // Get the request body and validate it.
    const json = await req.json()
    const body = lecturePatchSchema.parse(json)
    const { courseId, title } = body

    if (courseId) {
      if (!(await verifyCurrentUserHasAccessToCourse(courseId))) {
        return new Response(null, { status: 403 })
      }
    }

    // Check if the user has access to this lecture.
    const lecture = await db.lecture.findUnique({
      where: {
        id: lectureId,
      },
    })
    if (!lecture) return new Response(null, { status: 404 })
    if (lecture.userId !== session?.user?.id)
      return new Response(null, { status: 403 })

    // Connect the lecture to the course.
    await db.lecture.update({
      where: {
        id: lectureId,
      },
      data: {
        title,
        courseId,
      },
    })

    // Update the documents that belong to the lecture to have the correct courseId metadata.
    if (courseId) {
      const documents = await db.document.findMany({
        where: {
          lectureId,
        },
      })
      const documentQueries: string | any[] = []

      for (const document of documents) {
        // Add the courseId to the string field and then add the courseId to the nested metadata object.
        const metadata = document.metadata as {
          courseId: string
          lectureId: string
          embeddingIds: string[]
        }
        metadata.courseId = courseId

        const whereClause = Prisma.validator<Prisma.DocumentWhereInput>()({
          id: document.id,
        })
        const dataClause = Prisma.validator<Prisma.DocumentUpdateInput>()({
          metadata,
          // @ts-ignore - the courseId is not in the schema, but it's a valid field to connect the course and the document.
          courseId,
        })

        documentQueries.push(
          db.document.update({
            where: whereClause as Prisma.DocumentWhereUniqueInput,
            data: dataClause as Prisma.DocumentUpdateInput,
          })
        )
      }

      await db.$transaction(documentQueries)
    }

    return new Response(JSON.stringify({ message: "Lecture updated" }), {
      status: 200,
    })
  } catch (error) {
    console.error(error)
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 })
    }

    return new Response(null, { status: 500 })
  }
}
