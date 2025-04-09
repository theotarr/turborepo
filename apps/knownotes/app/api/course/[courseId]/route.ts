import { verifyCurrentUserHasAccessToCourse } from "@/lib/lecture/actions";
import { JSONContent } from "@tiptap/core";
import * as z from "zod";

import { db } from "@acme/db";

const routeContextSchema = z.object({
  params: z.object({
    courseId: z.string(),
  }),
});

export async function DELETE(
  _: Request,
  context: z.infer<typeof routeContextSchema>,
) {
  try {
    const { params } = routeContextSchema.parse(context);
    if (!(await verifyCurrentUserHasAccessToCourse(params.courseId))) {
      return new Response(null, { status: 403 });
    }

    await db.course.delete({
      where: {
        id: params.courseId as string,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}

const coursePatchSchema = z.object({
  name: z.string().min(3).max(128).optional(),
  description: z.string().optional(),
  notes: z.custom<JSONContent>().optional(),
});

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>,
) {
  try {
    const { params } = routeContextSchema.parse(context);

    // Check if the user has access to this course.
    if (!(await verifyCurrentUserHasAccessToCourse(params.courseId))) {
      return new Response(null, { status: 403 });
    }

    // Get the request body and validate it.
    const json = await req.json();
    const body = coursePatchSchema.parse(json);

    // Update the course.
    // TODO: Implement sanitization for content.
    await db.course.update({
      where: {
        id: params.courseId,
      },
      data: {
        name: body.name ?? undefined,
      },
    });

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}
