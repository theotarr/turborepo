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
  if (subscription.isPro) return; // The user already has or had an active subscription.

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

export async function createSubscription() {
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

export async function cancelSubscription() {
  const session = await auth();
  if (!session?.user) throw new Error("User not found.");

  try {
    const subscription = await getUserSubscriptionPlan(session.user.id);

    if (subscription.isPro) {
      await stripe.subscriptions.update(
        subscription.stripeSubscriptionId as string,
        {
          cancel_at_period_end: true,
        },
      );
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to cancel subscription.");
  }
}

export async function keepSubscription() {
  const session = await auth();
  if (!session?.user) throw new Error("User not found.");

  const subscription = await getUserSubscriptionPlan(session.user.id);

  if (!subscription.stripeSubscriptionId) {
    throw new Error("No active subscription found");
  }

  // If the subscription has not ended, then do not cancel it.
  if (subscription.stripeCurrentPeriodEnd > Date.now()) {
    await stripe.subscriptions.update(
      subscription.stripeSubscriptionId as string,
      {
        cancel_at_period_end: false,
      },
    );
  }
}

export async function pauseSubscription(resumeDate?: Date): Promise<boolean> {
  const session = await auth();
  if (!session?.user) throw new Error("User not found.");

  try {
    const subscription = await getUserSubscriptionPlan(session.user.id);

    if (!subscription.isPro || !subscription.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    // Validate resume date - maximum 3 months from now
    const maxResumeDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90); // 90 days (3 months)

    // Calculate resume date - default to 30 days if not provided but cap at 3 months
    const resumeAt =
      resumeDate && resumeDate <= maxResumeDate
        ? resumeDate
        : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    // Pause the subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      pause_collection: {
        behavior: "void",
        resumes_at: Math.floor(resumeAt.getTime() / 1000),
      },
    });

    // Update user record
    await supabase
      .from("User")
      .update({
        stripeSubscriptionPaused: true,
        stripeSubscriptionResumeAt: resumeAt.toISOString(),
      })
      .eq("id", session.user.id);

    return true;
  } catch (error) {
    console.error("Error pausing subscription:", error);
    throw new Error("Failed to pause subscription.");
  }
}

export async function resumeSubscription(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) throw new Error("User not found.");

  try {
    const dbSubscription = await getUserSubscriptionPlan(session.user.id);
    if (!dbSubscription.stripeSubscriptionId)
      throw new Error("No active subscription found");

    const subscription = await stripe.subscriptions.retrieve(
      dbSubscription.stripeSubscriptionId,
    );
    console.log(
      `Resuming subscription for ${session.user.id} with subscription id ${subscription.id}`,
    );

    // Unpause the subscription and reset the billing cycle anchor to now.
    // This will charge the customer immediately regardless of previous billing period.
    await stripe.subscriptions.update(subscription.id, {
      pause_collection: "",
      // The trial end cannot be after billing_cycle_anchor.
      // Consider ending the trial `trial_end=now`, however this will charge the customer immediately.
      // So if the user is trialing don't set the billing cycle anchor to now, otherwise set it to now and charge the customer immediately.
      ...(subscription &&
        subscription.status !== "trialing" && {
          billing_cycle_anchor: "now",
        }),
      proration_behavior: "none", // Don't prorate when changing the billing cycle.
    });

    console.log(
      `Resumed subscription for ${session.user.id} with subscription id ${subscription.id}`,
    );

    // Update the database with a temporary future end date to prevent payment dialogs from showing during the Stripe operations.
    await supabase
      .from("User")
      .update({
        stripeSubscriptionPaused: false,
        stripeSubscriptionResumeAt: null,
        stripeCurrentPeriodEnd: new Date(Date.now() + 10 * 60 * 1000), // 10-minute window to prevent payment dialogs from appearing.
      })
      .eq("id", session.user.id);

    return true;
  } catch (error) {
    console.error("Error resuming subscription:", error);

    // In case of an error, we need to reset the database to show paused status.
    await supabase
      .from("User")
      .update({
        stripeSubscriptionPaused: true,
      })
      .eq("id", session.user.id);

    throw new Error("Failed to resume subscription.");
  }
}
