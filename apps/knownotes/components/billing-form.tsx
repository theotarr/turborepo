"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createSubscription } from "@/lib/stripe/actions";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { UserSubscriptionPlan } from "types";

interface BillingFormProps extends React.HTMLAttributes<HTMLFormElement> {
  subscriptionPlan: UserSubscriptionPlan & {
    isCanceled: boolean;
  };
}

export function BillingForm({ subscriptionPlan, className }: BillingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function reactivateSubscription() {
    setIsLoading(true);

    try {
      if (
        subscriptionPlan.stripeCurrentPeriodEnd < new Date().getTime() ||
        subscriptionPlan.appStoreCurrentPeriodEnd < new Date().getTime()
      ) {
        // The subscription has ended, create a new subscription
        await createSubscription();
        toast.success("Subscription reactivated successfully");
      }

      // Redirect to `/dashboard/billing`
      router.push("/dashboard/billing");
      router.refresh();
    } catch (error) {
      console.error("Error managing subscription:", error);
      toast.error("Failed to manage subscription. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // If the user has no subscription, don't show the billing form.
  if (
    !subscriptionPlan.stripeSubscriptionId &&
    !subscriptionPlan.appStoreSubscriptionId
  )
    return null;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your billing and payment methods.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
        {subscriptionPlan.stripeSubscriptionId ? (
          <>
            {subscriptionPlan.stripeCurrentPeriodEnd > new Date().getTime() ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/billing")}
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Manage Billing
              </Button>
            ) : (
              <Button
                onClick={reactivateSubscription}
                size="sm"
                variant="default"
                disabled={isLoading}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reactivate Subscription
              </Button>
            )}
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
                      Your subscription has ended. Reactivate your subscription
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
            Your subscription was created through the Apple App Store. Use your
            Apple device to manage your subscription.
          </div>
        ) : (
          <></>
        )}
      </CardFooter>
    </Card>
  );
}
