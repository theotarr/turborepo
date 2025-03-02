import type { Stripe } from "stripe";
import { redirect } from "next/navigation";
import { BillingCard } from "@/components/billing-card";
import { DashboardHeader } from "@/components/header";
import { PaymentInfoCard } from "@/components/payment-info-card";
import { DashboardShell } from "@/components/shell";
import { SubscriptionManagementCard } from "@/components/subscription-management-card";
import { stripe } from "@/lib/stripe";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { absoluteUrl } from "@/lib/utils";

import { auth } from "@acme/auth";

const title = "Billing";
const description = "Manage your subscription and billing information.";
const ogUrl = `${absoluteUrl("")}/api/og?heading=${
  description ?? title
}&mode=light&type=${title}`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: absoluteUrl("/dashboard/billing"),
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

export default async function BillingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const subscriptionPlan = await getUserSubscriptionPlan(session.user.id);

  // If user has a paid plan, check cancel status on Stripe.
  let cancelAtPeriodEnd = false;
  let paymentMethods: (Stripe.PaymentMethod & {
    isDefaultPaymentMethod: boolean;
  })[] = [];

  if (subscriptionPlan.isPro && subscriptionPlan.stripeSubscriptionId) {
    const stripePlan = await stripe.subscriptions.retrieve(
      subscriptionPlan.stripeSubscriptionId,
    );
    cancelAtPeriodEnd = stripePlan.cancel_at_period_end;

    const customer = await stripe.customers.retrieve(
      stripePlan.customer as string,
    );

    if (customer.deleted) {
      return (
        <DashboardShell>
          <DashboardHeader
            heading="Billing"
            text="Manage your subscription and billing information."
          />
          <div className="grid gap-10">
            <div className="rounded-lg border bg-background p-6">
              Customer has been deleted. Please contact support.
            </div>
          </div>
        </DashboardShell>
      );
    }

    // Get the customer's payment methods.
    const methods = await stripe.paymentMethods.list({
      customer: stripePlan.customer as string,
    });

    for (const method of methods.data) {
      if (method.id === customer.invoice_settings.default_payment_method) {
        paymentMethods.push({ ...method, isDefaultPaymentMethod: true });
      } else {
        paymentMethods.push({ ...method, isDefaultPaymentMethod: false });
      }
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Billing"
        text="Manage your subscription and billing information."
      />
      <div className="grid gap-10">
        <BillingCard
          subscriptionPlan={{
            ...subscriptionPlan,
            isCanceled: cancelAtPeriodEnd,
          }}
        />
        {subscriptionPlan.isPro && (
          <PaymentInfoCard paymentMethods={paymentMethods} />
        )}
        {subscriptionPlan.isPro && (
          <SubscriptionManagementCard
            subscriptionPlan={{
              ...subscriptionPlan,
              isCanceled: cancelAtPeriodEnd,
            }}
          />
        )}
      </div>
    </DashboardShell>
  );
}
