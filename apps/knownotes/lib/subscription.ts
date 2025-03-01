import { freePlan, proPlan } from "@/config/subscriptions";
import { UserSubscriptionPlan } from "types";

import { supabase } from "./supabase";

export async function getUserSubscriptionPlan(
  userId: string,
): Promise<UserSubscriptionPlan> {
  const { data: user } = await supabase
    .from("User")
    .select(
      `stripeSubscriptionId,
      stripeCurrentPeriodEnd,
      stripeCustomerId,
      stripePriceId,
      stripeSubscriptionPaused,
      stripeSubscriptionResumeAt,
      appStoreSubscriptionId,
      appStoreProductId,
      appStoreCurrentPeriodEnd`,
    )
    .eq("id", userId)
    .single();

  if (!user) {
    throw new Error("User not found");
  }
  // Get the user's plan from Stripe price Id or App Store product Id
  let plan = freePlan;
  const isStripeSubscriptionActive =
    proPlan.stripePriceIds.includes(user.stripePriceId) &&
    new Date(user.stripeCurrentPeriodEnd).getTime() > new Date().getTime(); // Check if the Stripe subscription is active

  const isAppStoreSubscriptionActive =
    // proPlan.appStoreProductIds?.includes(user.appStoreProductId) &&
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
    stripeCurrentPeriodEnd: new Date(user.stripeCurrentPeriodEnd).getTime(),
    appStoreCurrentPeriodEnd: new Date(user.appStoreCurrentPeriodEnd).getTime(),
  };
}
