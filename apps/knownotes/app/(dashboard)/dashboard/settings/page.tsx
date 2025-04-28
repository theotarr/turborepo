import { redirect } from "next/navigation";
import { BillingForm } from "@/components/billing-form";
import { DashboardHeader } from "@/components/header";
import { UsageCard } from "@/components/usage-card";
import { UserDeleteForm } from "@/components/user-delete-form";
import { UserNameForm } from "@/components/user-name-form";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

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

  // Get usage statistics
  const usageStats = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      _count: {
        select: {
          lectures: true,
          chats: true,
        },
      },
    },
  });

  // Count different types of lectures
  const lectureStats = await db.lecture.groupBy({
    by: ["type"],
    where: {
      userId: session.user.id,
    },
    _count: true,
  });

  // Format lecture stats
  const lecturesByType = {
    AUDIO_FILE: 0,
    YOUTUBE: 0,
    PDF: 0,
    LIVE: 0,
  };

  lectureStats.forEach((stat) => {
    if (stat.type in lecturesByType) {
      lecturesByType[stat.type as keyof typeof lecturesByType] = stat._count;
    }
  });

  // If user has a paid plan, check cancel status on Stripe.
  let cancelAtPeriodEnd = false;

  if (subscriptionPlan.isPro && subscriptionPlan.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      subscriptionPlan.stripeSubscriptionId,
    );
    cancelAtPeriodEnd = stripePlan.cancel_at_period_end;
  }

  return (
    <div className="grid items-start gap-8">
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings."
      />
      <div className="mt-6 grid gap-10">
        <UserNameForm
          user={{
            id: session.user.id,
            name: session.user.name || "",
            email: session.user.email || "",
          }}
        />
        <UsageCard
          totalNotes={usageStats?._count.lectures || 0}
          notesByType={lecturesByType}
        />
        <BillingForm
          subscriptionPlan={{
            ...subscriptionPlan,
            isCanceled: cancelAtPeriodEnd,
          }}
        />
        {!subscriptionPlan.stripeSubscriptionId ||
        subscriptionPlan.stripeCurrentPeriodEnd < new Date() ? (
          <UserDeleteForm user={{ id: session.user.id }} />
        ) : null}
      </div>
    </div>
  );
}
