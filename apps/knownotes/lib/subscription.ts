import { freePlan, proPlan } from "@/config/subscriptions";
import { UserSubscriptionPlan } from "types";

import { db } from "@acme/db";

export async function getUserSubscriptionPlan(
  userId: string,
): Promise<UserSubscriptionPlan> {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }
  // Get the user's plan from Stripe price Id or App Store product Id
  let plan = freePlan;
  const isStripeSubscriptionActive =
    user.stripePriceId &&
    proPlan.stripePriceIds.includes(user.stripePriceId) &&
    user.stripeCurrentPeriodEnd &&
    new Date(user.stripeCurrentPeriodEnd).getTime() > new Date().getTime(); // Check if the Stripe subscription is active

  const isAppStoreSubscriptionActive =
    // proPlan.appStoreProductIds?.includes(user.appStoreProductId) &&
    user.appStoreCurrentPeriodEnd &&
    new Date(user.appStoreCurrentPeriodEnd).getTime() > new Date().getTime(); // Check if the App Store subscription is active

  if (isStripeSubscriptionActive && isAppStoreSubscriptionActive)
    throw new Error(
      "User cannot have active subscriptions on both Stripe and App Store",
    );

  if (isStripeSubscriptionActive || isAppStoreSubscriptionActive)
    plan = proPlan;

  return {
    ...plan,
    ...user,
    isPro: plan !== freePlan,
    isPaused: user.stripeSubscriptionPaused || false,
    resumeAt: user.stripeSubscriptionResumeAt
      ? new Date(user.stripeSubscriptionResumeAt).getTime()
      : null,
    stripeCurrentPeriodEnd: user.stripeCurrentPeriodEnd
      ? new Date(user.stripeCurrentPeriodEnd).getTime()
      : 0,
    appStoreCurrentPeriodEnd: user.appStoreCurrentPeriodEnd
      ? new Date(user.appStoreCurrentPeriodEnd).getTime()
      : 0,
  };
}
