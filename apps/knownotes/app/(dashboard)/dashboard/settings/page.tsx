import { redirect } from "next/navigation";
import { userAgent } from "next/server";
import { BillingForm } from "@/components/billing-form";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";
import { UserDeleteForm } from "@/components/user-delete-form";
import { UserNameForm } from "@/components/user-name-form";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";

import { auth } from "@acme/auth";

const title = "Settings";
const description = "Manage your account settings.";
const ogUrl = `${absoluteUrl("")}/api/og?heading=${
  description ?? title
}&mode=light&type=${title}`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: absoluteUrl("/dashboard/settings"),
    images: [
      {
        url: ogUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogUrl],
  },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const subscriptionPlan = await getUserSubscriptionPlan(session.user.id);

  // If user has a paid plan, check cancel status on Stripe.
  let cancelAtPeriodEnd = false;

  if (subscriptionPlan.isPro && subscriptionPlan.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      subscriptionPlan.stripeSubscriptionId,
    );
    cancelAtPeriodEnd = stripePlan.cancel_at_period_end;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings."
      />
      <div className="grid gap-10">
        <UserNameForm
          user={{
            id: session.user.id,
            name: session.user.name || "",
            email: session.user.email || "",
          }}
        />
        <BillingForm
          subscriptionPlan={{
            ...subscriptionPlan,
            isCanceled: cancelAtPeriodEnd,
          }}
        />
        {!subscriptionPlan?.stripeCurrentPeriodEnd ||
        subscriptionPlan.stripeCurrentPeriodEnd <= new Date() ? (
          <UserDeleteForm user={{ id: session.user.id }} />
        ) : null}
      </div>
    </DashboardShell>
  );
}
