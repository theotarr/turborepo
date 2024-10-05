import { redirect } from "next/navigation"
import { auth } from "@acme/auth"

import { getUserSubscriptionPlan } from "@/lib/subscription"
import { PaymentElementsForm } from "@/components/payment-element"

export const metadata = {
  title: "Welcome to KnowNotes!",
  description:
    "Thanks for joining us! We'd love to hear about your needs and how we can help you.",
}

export default async function WelcomePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const subscription = await getUserSubscriptionPlan(session.user.id)

  // if (subscription.stripeCurrentPeriodEnd < new Date().getTime()) {
  //   // subscription expired, redirect to settings page to update payment method
  //   redirect("/dashboard/settings")
  // }

  if (subscription.isPro) {
    // already subscribed, redirect to dashboard
    redirect("/dashboard")
  }

  return (
    <div className="container grid h-screen w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="hidden h-full bg-muted lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <PaymentElementsForm />
        </div>
      </div>
    </div>
  )
}
