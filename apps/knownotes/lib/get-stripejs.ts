/**
 * This is a singleton to ensure we only instantiate Stripe once.
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export default function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    // We can't import the env.ts file here because this needs to run on the client.
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
    );
  }
  return stripePromise;
}
