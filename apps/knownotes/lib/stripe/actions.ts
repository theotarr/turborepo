"use server";

import type { Stripe } from "stripe";
import { proPlan } from "@/config/subscriptions";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";

import { trackMetaEvent, trackTiktokEvent } from "@acme/analytics";
import { auth } from "@acme/auth";

import { supabase } from "../supabase";

export async function getPromotionCode(
  promotionCode: string,
): Promise<Stripe.PromotionCode | undefined> {
  const codes = await stripe.promotionCodes.list({});
  const promotion = codes.data.find((code) => code.code === promotionCode);
  return promotion;
}

export async function createSetupIntent(promotekitReferral?: string): Promise<{
  client_secret: string;
}> {
  const session = await auth();
  if (!session) throw new Error("User not found.");

  const subscription = await getUserSubscriptionPlan(session.user.id);
  if (subscription.isPro) throw new Error("User is already subscribed.");

  // Check if the user already has a stripe customer id
  let customer: Stripe.Customer | Stripe.DeletedCustomer | undefined =
    undefined;
  if (subscription.stripeCustomerId) {
    // Fetch the stripe customer
    customer = await stripe.customers.retrieve(subscription.stripeCustomerId);
  } else {
    // Create a stipe customer
    customer = await stripe.customers.create({
      email: session.user.email as string,
      metadata: {
        userId: session.user.id,
      },
    });

    // Update the user's stripe customer id
    await supabase
      .from("User")
      .update({
        stripeCustomerId: customer.id,
      })
      .eq("id", session.user.id);
  }

  const setupIntent: Stripe.SetupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    automatic_payment_methods: { enabled: true },
    metadata: {
      userId: session.user.id,
      promotekit_refferal: promotekitReferral as string,
    },
  });

  // Report the user adding payment info to Meta and TikTok.
  await trackMetaEvent({
    userId: session.user.id,
    email: session.user.email as string,
    event: "AddPaymentInfo",
  });
  await trackTiktokEvent({
    userId: session.user.id,
    email: session.user.email as string,
    event: "AddPaymentInfo",
    url: "https://knownotes.ai/dashboard",
  });

  return {
    client_secret: setupIntent.client_secret as string,
  };
}

export async function validatePromotionCode(
  promotionCode: string,
): Promise<{ valid: boolean; amountOff: number }> {
  const promotion = await getPromotionCode(promotionCode);

  if (!promotion) {
    console.error("Promotion not found.");
    return {
      valid: false,
      amountOff: 0,
    };
  }
  if (!promotion.active) {
    console.error("Promotion is not active.");
    return {
      valid: false,
      amountOff: 0,
    };
  }
  if (!promotion.coupon.valid) {
    console.error("Coupon is not valid.");
    return {
      valid: false,
      amountOff: 0,
    };
  }

  return {
    valid: true,
    amountOff: promotion.coupon.amount_off as number,
  };
}

export async function updateUserSubsciptionPlan(setupIntentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("User not found.");

  const subscription = await getUserSubscriptionPlan(
    session?.user.id as string,
  );
  if (subscription.isPro) return; // The user is already subscribed.

  // If the user is not subscribed, then fetch the setup intent to check if it succeeded.
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

  if (setupIntent.status === "succeeded") {
    // Add the price id and a temporary current period end date of 5min from now (to allow the user continue) to wait for Stripe webhook to trigger.
    await supabase
      .from("User")
      .update({
        stripePriceId: proPlan.stripePriceIds[0],
        stripeCurrentPeriodEnd: new Date(
          Date.now() + 1000 * 60 * 5,
        ).toISOString(),
      })
      .eq("id", session?.user.id);
  } else {
    // If the setup intent failed, then don remove the stripe customer id from the user.
    await supabase
      .from("User")
      .update({
        stripeCustomerId: undefined,
        stripeCurrentPeriodEnd: undefined,
        stripeSubscriptionId: undefined,
        stripePriceId: undefined,
      })
      .eq("id", session?.user.id);
  }
}

export async function unpauseSubscription() {
  const session = await auth();
  if (!session?.user) throw new Error("User not found.");

  const subscription = await getUserSubscriptionPlan(
    session?.user.id as string,
  );

  // If the subscription has ended, then create a new subscription with the same price id.
  if (subscription.stripeCurrentPeriodEnd < Date.now()) {
    const newSubscription = await stripe.subscriptions.create({
      customer: subscription.stripeCustomerId as string,
      items: [{ price: proPlan.stripePriceIds[0] }], // Use the price of $5.99/week.
      metadata: {
        userId: session.user.id,
      },
    });

    // Update the user's subscription id.
    await supabase
      .from("User")
      .update({
        stripeSubscriptionId: newSubscription.id,
        stripePriceId: newSubscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          newSubscription.current_period_end * 1000,
        ),
      })
      .eq("id", session.user.id);
  }
}
