import NewUserOfferEmail from "@/components/emails/new-user-offer-email";
import { env } from "@/env";
import { resend } from "@/lib/resend";

import { db } from "@acme/db";

export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response(
      JSON.stringify({
        message: "Invalid authorization header.",
      }),
      {
        status: 401,
      },
    );
  }

  // Get all the users that have signed up, but haven't completed the paywall. And haven't been sent the free trial offer email.
  const users = await db.user.findMany({
    where: {
      stripePriceId: null,
      sentFreeTrialOfferEmailAt: null,
    },
  });

  // Send the free trial offer email to each user.
  const successfulEmails: string[] = [];

  for (const user of users) {
    if (!user.email) continue;

    const emailResponse = await resend.emails.send({
      from: "Theo from KnowNotes <theo@knownotes.ai>",
      to: user.email,
      subject: "Want to try KnowNotes for free?",
      html: `Hey,

We lost you when you hit the checkout page! If you still want to try out KnowNotes, we'll give you a free week on us.

<a href="https://knownotes.ai?ref=free-trial-email">Try KnowNotes for free</a>

Theo (Founder @ KnowNotes)`,
      react: NewUserOfferEmail(),
    });

    if (emailResponse.error) {
      console.error(
        `Error sending free trial offer email to ${user.email}:`,
        emailResponse.error,
      );
      continue;
    }

    // Update the user's sentFreeTrialOfferEmailAt timestamp.
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        sentFreeTrialOfferEmailAt: new Date(),
      },
    });
    successfulEmails.push(user.email);
  }

  return new Response(
    JSON.stringify({
      message:
        successfulEmails.length > 1
          ? `Sent emails to: ${successfulEmails.join(", ")}.`
          : "No emails sent.",
    }),
    { status: 200 },
  );
}
