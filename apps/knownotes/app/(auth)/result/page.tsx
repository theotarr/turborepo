import { redirect } from "next/navigation"
import { auth } from "@acme/auth"
import type { Stripe } from "stripe"

import { proPlan } from "@/config/subscriptions"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { Icons } from "@/components/icons"
import { PaymentResultRedirect } from "@/components/payment-result-redirect"

export const metadata = {
  title: "Welcome to KnowNotes!",
  description:
    "Thanks for joining us! We'd love to hear about your needs and how we can help you.",
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: { setup_intent: string }
}) {
  if (!searchParams.setup_intent) redirect("/welcome")
  const session = await auth()
  const user = await db.user.findUnique({
    where: { id: session?.user?.id },
  })

  if (!user) redirect("/welcome")
  if (user.stripeSubscriptionId) redirect("/dashboard")

  const setuptIntent: Stripe.SetupIntent = await stripe.setupIntents.retrieve(
    searchParams.setup_intent
  )
  const result = setuptIntent.status === "succeeded" ? "success" : "error"

  if (result === "error") {
    // remove the stripe customer id from the user
    await db.user.update({
      where: { stripeCustomerId: setuptIntent.customer as string },
      data: {
        stripeCustomerId: undefined,
        stripeCurrentPeriodEnd: undefined,
        stripeSubscriptionId: undefined,
        stripePriceId: undefined,
      },
    })
  } else if (result === "success") {
    // Add the price id and a temporary current period end date of 5min from now to wait for stripe webhook
    await db.user.update({
      where: { id: user?.id },
      data: {
        stripePriceId: proPlan.stripePriceIds[0],
        stripeCurrentPeriodEnd: new Date(
          Date.now() + 1000 * 60 * 5
        ).toISOString(),
      },
    })
  }

  return (
    <div className="container grid h-screen w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="hidden h-full bg-muted lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-6 text-center">
            <Icons.logo className="mx-auto h-12 w-12" />
            <h1 className="text-2xl font-semibold tracking-tight">
              {result === "success"
                ? "Ready to level up?"
                : "Oops, something went wrong."}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {result === "success"
                ? "We're redirecting automatically to get started."
                : "We were unable to process your payment. We're automatically redirecting you to try again."}
            </p>
          </div>
          <PaymentResultRedirect result={result} />
        </div>
      </div>
    </div>
  )
}
