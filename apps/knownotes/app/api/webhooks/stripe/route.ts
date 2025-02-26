import { headers } from "next/headers";
import { proPlan } from "@/config/subscriptions";
import { env } from "@/env";
import { db } from "@/lib/db";
import {
  getResendContactIdFromEmail,
  PAID_USER_AUDIENCE_ID,
  resend,
} from "@/lib/resend";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

import { trackMetaEvent, trackTiktokEvent } from "@acme/analytics";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Update the user in our database.
    // Since this is the initial subscription, we need to update the subscription id and customer id.
    await db.user.update({
      where: {
        id: session?.metadata?.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
      },
    });
  }

  if (event.type === "payment_intent.succeeded") {
    // If the Stripe session object doesn't have a subscription, we don't need to do anything.
    if (!session.subscription) return new Response(null, { status: 200 });

    // Get the user to check if they have a subscription or not.
    const user = await db.user.findUnique({
      where: {
        stripeCustomerId: session.customer as string,
      },
    });

    // if (!user) {
    //   // The user deleted their account, we should cancel the subscription.
    //   await stripe.subscriptions.del(session.subscription as string)
    //   return new Response(null, { status: 200 })
    // }
    if (!user) return new Response("User does not exist.", { status: 404 });

    if (!user.stripeSubscriptionId) {
      return new Response("User does not have a subscription.", {
        status: 404,
      });
    }

    // The user has a subscription, we need to update the subscription to the new price and end period.
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Update the price id and set the new period end.
    await db.user.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
      },
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    // Whenever the customer pays an invoice, we need to update the subscription details.
    if (!session.subscription) return new Response(null, { status: 200 });

    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // Update the price id and set the new period end.
    await db.user.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
      },
    });
  }

  if (event.type === "setup_intent.succeeded") {
    // The user's payment information has been successfully stored.
    // We should make the payment method the default payment method.
    const user = await db.user.findUnique({
      where: {
        stripeCustomerId: session.customer as string,
      },
    });
    if (!user) return new Response("User does not exist.", { status: 404 });

    const setupIntent = await stripe.setupIntents.retrieve(
      session.id as string,
    );
    console.log("Setup intent:", setupIntent);
    const paymentMethod = setupIntent.payment_method as string;
    console.log("Payment method:", paymentMethod);

    // Attach the payment method to the stripe customer.
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: session.customer as string,
    });

    // Make the payment method the default payment method.
    await stripe.customers.update(session.customer as string, {
      invoice_settings: {
        default_payment_method: paymentMethod,
      },
    });

    // Check if the user has a subscription.
    const hasSubscription = user.stripeSubscriptionId
      ? await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
      : null;

    if (hasSubscription) {
      // Return a 200 response if the user has a subscription.
      // We don't need to create a payment intent or create a subscription.
      return new Response(null, { status: 200 });
    }

    // Check if the user has a referral.
    const promotekitReferral = session?.metadata?.promotekitReferral as string;

    const subscription = await stripe.subscriptions.create({
      customer: session.customer as string,
      items: [{ price: proPlan.stripePriceIds[0] }], // Use the price of $5.99/week.
      trial_period_days: 3, // 3 day trial.
      metadata: {
        userId: user.id,
        promotekit_referral: promotekitReferral,
      },
    });

    // Report the start of the trial to Meta.
    console.log("Reporting start of trial to Meta...");
    await trackMetaEvent({
      userId: user.id,
      email: user.email,
      event: "StartTrial",
    });
    await trackTiktokEvent({
      userId: user.id,
      email: user.email,
      event: "Subscribe",
      url: "https://knownotes.ai/dashboard",
    });

    console.log("Subscription created:", subscription);

    // Update the user stripe into in our database.
    // Since this is the initial subscription, we need to update the subscription id and customer id.
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
      },
    });

    return new Response(null, { status: 200 });
  }

  if (event.type === "customer.subscription.created") {
    // If a subscription is created, we need to update the user's subscription id in the db.
    const { id: stripeSubscriptionId } = event.data
      .object as Stripe.Subscription;
    const subscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // Check if the subscription is active.
    if (
      subscription.status === "canceled" ||
      subscription.status === "incomplete" ||
      subscription.status === "incomplete_expired"
    ) {
      return new Response(
        "Subscription is either canceled, incomplete, or incomplete expired.",
        { status: 200 },
      );
    }

    const user = await db.user.findUnique({
      where: {
        stripeCustomerId: subscription.customer as string,
      },
    });
    if (!user) return new Response("User does not exist.", { status: 404 });

    // Add the newly paying user to the paid resend audience.
    await resend.contacts.create({
      email: user.email as string,
      firstName: user.name || undefined,
      unsubscribed: false,
      audienceId: PAID_USER_AUDIENCE_ID,
    });

    // Update the user's subscription id in the db.
    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        stripeSubscriptionId,
        stripePriceId: subscription.items.data[0].price.id,
      },
    });
  }

  // Primary purpose of this is to listen for manual updates to the subscription.
  // For example, if we extend trials or change prices.
  // This should automatically update the subscription in the db.
  if (event.type === "customer.subscription.updated") {
    // If the user's subscription is updated, we need to update the user's subscription id in the db.
    const { id: stripeSubscriptionId } = event.data
      .object as Stripe.Subscription;
    const subscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // Check if the subscription is active.
    if (
      subscription.status === "canceled" ||
      subscription.status === "incomplete" ||
      subscription.status === "incomplete_expired"
    ) {
      return new Response(
        "Subscription is either canceled, incomplete, or incomplete expired.",
        { status: 200 },
      );
    }

    const user = await db.user.findUnique({
      where: {
        stripeCustomerId: subscription.customer as string,
      },
    });
    if (!user) return new Response("User does not exist.", { status: 404 });

    // Update the user's subscription id in the db.
    console.log(
      `Updating ${user.email}'s subscription (${subscription.id})...`,
    );
    await db.user.update({
      where: {
        stripeSubscriptionId,
      },
      data: {
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    // If the user cancels their subscription, we need to remove their subscription id from the db.
    const stripeSubscriptionId = (event.data.object as Stripe.Subscription).id;

    const user = await db.user.findUnique({
      where: {
        stripeSubscriptionId,
      },
    });
    if (!user)
      return new Response("A user does not have that Stripe subscription id.", {
        status: 404,
      });

    // Get the contact id from the email.
    const resendContactId = await getResendContactIdFromEmail(
      user.email as string,
    );

    // Remove the paying user from the paid audience.
    await resend.contacts.remove({
      id: resendContactId as string,
      audienceId: PAID_USER_AUDIENCE_ID,
    });

    // Remove the subscription id from the user.
    await db.user.update({
      where: {
        stripeSubscriptionId,
      },
      data: {
        stripeSubscriptionId: undefined,
      },
    });
  }

  return new Response(null, { status: 200 });
}
