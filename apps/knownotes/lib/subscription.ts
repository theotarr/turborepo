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
      stripePriceId`,
    )
    .eq("id", userId)
    .single();

  if (!user) {
    throw new Error("User not found");
  }

  // Get the user's plan from Stripe price Id
  let plan = freePlan;
  if (
    proPlan.stripePriceIds.includes(user.stripePriceId) &&
    new Date(user.stripeCurrentPeriodEnd).getTime() > new Date().getTime() // Check if the subscription is active
  ) {
    plan = proPlan;
  }

  return {
    ...plan,
    ...user,
    isPro: plan !== freePlan,
    stripeCurrentPeriodEnd: new Date(user.stripeCurrentPeriodEnd).getTime(),
  };
}
