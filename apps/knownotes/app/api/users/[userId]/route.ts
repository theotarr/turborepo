import { resend, USER_AUDIENCE_ID } from "@/lib/resend";
import { userSchema } from "@/lib/validations/user";
import { z } from "zod";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

const routeContextSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
});

export async function GET(req: Request) {
  try {
    // Validate the route context.
    const { params } = routeContextSchema.parse(req);

    // Ensure user is authentication and has access to this user.
    const session = await auth();
    if (!session?.user || params.userId !== session?.user.id) {
      return new Response(null, { status: 403 });
    }

    // Get the user.
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: z.infer<typeof routeContextSchema>,
) {
  try {
    // Validate the route context.
    const { params } = routeContextSchema.parse(context);

    // Ensure user is authentication and has access to this user.
    const session = await auth();
    if (!session?.user || params.userId !== session?.user.id) {
      return new Response(null, { status: 403 });
    }

    // Get the request body and validate it.
    const body = await req.json();
    const payload = userSchema.parse(body);

    // Update the user.
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: payload.name,
        email: payload.email,
      },
    });

    // // Opened a new issue about not being able to update a contact's email: https://github.com/resend/resend-node/issues/308
    // // Update the user in the Resend Audience.
    // if (payload.email || payload.name) {
    //   const contactId = await getResendContactId(session.user.email!)
    //   await resend.contacts.update({
    //     id: contactId!,
    //     email: payload.email || undefined,
    //     firstName: payload.name || undefined,
    //   })
    // }

    return new Response(null, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    return new Response(null, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  context: z.infer<typeof routeContextSchema>,
) {
  try {
    // Validate the route context.
    const { params } = routeContextSchema.parse(context);

    // Ensure user is authentication and has access to this user.
    const session = await auth();
    if (params.userId !== session?.user.id)
      return new Response(null, { status: 403 });
    if (!session || !session?.user) return new Response(null, { status: 403 });

    console.log("Deleting user", {
      id: session.user.id,
      email: session.user.email,
    });

    // Delete the user.
    await db.user.delete({
      where: {
        id: session.user.id,
      },
    });

    // // Remove the user from the Resend Audience.
    // session.user.email &&
    //   (await resend.contacts.remove({
    //     email: session.user.email,
    //     audienceId: USER_AUDIENCE_ID,
    //   }));

    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
}
