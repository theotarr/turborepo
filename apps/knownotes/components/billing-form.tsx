"use client";

import * as React from "react";
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { UserSubscriptionPlan } from "types";

interface BillingFormProps extends React.HTMLAttributes<HTMLFormElement> {
  subscriptionPlan: UserSubscriptionPlan & {
    isCanceled: boolean;
  };
}

export function BillingForm({
  subscriptionPlan,
  className,
  ...props
}: BillingFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function onSubmit(event) {
    event.preventDefault();
    setIsLoading(!isLoading);

    if (
      subscriptionPlan.stripeCurrentPeriodEnd < new Date().getTime() ||
      subscriptionPlan.appStoreCurrentPeriodEnd < new Date().getTime()
    ) {
      // The subscription has ended.
      // Unpause the subscription.
    }

    // Get a Stripe session URL.
    const response = await fetch("/api/users/stripe");

    if (!response?.ok) {
      return toast.error(
        "Something went wrong. Please refresh the page and try again.",
      );
    }

    // Redirect to the Stripe session.
    // This could be a checkout page for initial upgrade.
    // Or portal to manage existing subscription.
    const session = await response.json();
    if (session) {
      window.location.href = session.url;
    }
  }

  // If the user has no subscription, don't show the billing form.
  if (
    !subscriptionPlan.stripeSubscriptionId &&
    !subscriptionPlan.appStoreSubscriptionId
  )
    return null;

  return (
    <form className={cn(className)} onSubmit={onSubmit} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            Manage your billing and payment methods.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
          {subscriptionPlan.stripeSubscriptionId ? (
            <>
              <button
                type="submit"
                className={cn(
                  buttonVariants({
                    variant: subscriptionPlan.stripeSubscriptionId
                      ? "outline"
                      : "default",
                  }),
                )}
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                {subscriptionPlan.stripeCurrentPeriodEnd >
                new Date().getTime() ? (
                  <>Manage Billing</>
                ) : (
                  <>Unpause Subscription</>
                )}
              </button>
              <div>
                {subscriptionPlan.stripeCurrentPeriodEnd <
                new Date().getTime() ? (
                  <>
                    {subscriptionPlan.isCanceled ? (
                      <p className="text-xs font-medium">
                        Your subscription is canceled and expires on{" "}
                        {formatDate(subscriptionPlan.stripeCurrentPeriodEnd)}
                      </p>
                    ) : (
                      <p className="text-xs font-medium">
                        Your subscription has ended. Unpause your subscription
                        to continue using KnowNotes.
                      </p>
                    )}
                  </>
                ) : (
                  <></>
                )}
              </div>
            </>
          ) : (
            <></>
          )}
          {subscriptionPlan.appStoreCurrentPeriodEnd ? (
            <div className="text-sm font-medium">
              Your subscription was created through the Apple App Store. Use
              your Apple device to manage your subscription.
            </div>
          ) : (
            <></>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}
