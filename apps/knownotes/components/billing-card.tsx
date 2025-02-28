"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { keepSubscription } from "@/lib/stripe/actions";
import { formatDate } from "@/lib/utils";
import { UserSubscriptionPlan } from "@/types";
import { toast } from "sonner";

import { Icons } from "./icons";
import { Button } from "./ui/button";

interface BillingCardProps {
  subscriptionPlan: UserSubscriptionPlan & {
    isCanceled: boolean;
  };
}

export function BillingCard({ subscriptionPlan }: BillingCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>
          View your current plan and manage your billing information.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {subscriptionPlan.isPro ? (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Plan</div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Pro
                </div>
              </div>
            </div>
            {subscriptionPlan.stripeCurrentPeriodEnd && (
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {subscriptionPlan.isCanceled ? "Cancels on" : "Renews on"}
                </div>
                <div className="text-sm font-medium">
                  {formatDate(subscriptionPlan.stripeCurrentPeriodEnd)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-md bg-muted p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Icons.magic className="size-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Upgrade to Pro</div>
                <div className="text-sm text-muted-foreground">
                  Unlock all features and get unlimited access.
                </div>
              </div>
            </div>
          </div>
        )}
        {subscriptionPlan.isPro && subscriptionPlan.isCanceled && (
          <div className="mt-2">
            <Button
              variant="default"
              className="w-full"
              onClick={async () => {
                setIsLoading(true);
                try {
                  await keepSubscription();
                  router.refresh();
                  toast.success("Subscription restored", {
                    description:
                      "Your subscription will continue at the end of the billing cycle.",
                  });
                } catch (error) {
                  toast.error("Failed to restore subscription", {
                    description: "Please try again or contact support.",
                  });
                }
                setIsLoading(false);
              }}
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              )}
              Keep Subscription
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
