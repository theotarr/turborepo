import { redirect } from "next/navigation"
import { auth } from "@acme/auth"

import { getUserSubscriptionPlan } from "@/lib/subscription"
import { PaymentDialog } from "@/components/payment-dialog"

interface LectureLayoutProps {
  children?: React.ReactNode
}

export default async function LectureLayout({ children }: LectureLayoutProps) {
  const session = await auth()
  if (!session) return redirect("/login")

  const subscription = await getUserSubscriptionPlan(session.user.id)
  if (
    subscription.stripeSubscriptionId &&
    subscription.stripeCurrentPeriodEnd < new Date().getTime()
  )
    // If the user has a pro plan and the subscription has expired, redirect to the settings page to update the payment method.
    return redirect("/dashboard/settings")

  return (
    <>
      <PaymentDialog subscription={subscription} />
      {children}
    </>
  )
}
