import { proPlan } from "@/config/subscriptions";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";
import { z } from "zod";

import { auth } from "@acme/auth";

const billingUrl = absoluteUrl("/dashboard/billing");

export async function GET() {
  try {
    const session = await auth();
    if (!session) return new Response(null, { status: 403 });

    const subscriptionPlan = await getUserSubscriptionPlan(session.user.id);

    // The user is on the pro plan.
    // Create a portal session to manage subscription.
    if (
      subscriptionPlan.stripeCustomerId &&
      subscriptionPlan.stripeSubscriptionId &&
      subscriptionPlan.stripeCurrentPeriodEnd > new Date().getTime()
    ) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: subscriptionPlan.stripeCustomerId,
        return_url: billingUrl,
      });

      return new Response(JSON.stringify({ url: stripeSession.url }));
    }

    // The user is on the free plan.
    // Create a checkout session to upgrade.
    const stripeSession = await stripe.checkout.sessions.create({
      customer: subscriptionPlan.stripeCustomerId || undefined,
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ["card", "cashapp", "link"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: session.user.email as string,
      line_items: [
        {
          price: proPlan.stripePriceIds[0],
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
    });

    return new Response(JSON.stringify({ url: stripeSession.url }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 422 });
    }

    console.error(error);

    return new Response(null, { status: 500 });
  }
}
