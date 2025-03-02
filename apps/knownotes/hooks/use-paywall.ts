"use client";

import { useEffect } from "react";
import { usePaymentDialogStore } from "@/components/payment-dialog";
import { useReactivateDialogStore } from "@/components/reactivate-subscription-dialog";
import { useResumeSubscriptionDialogStore } from "@/components/resume-subscription-dialog";
import { api } from "@/lib/trpc/react";

export function usePaywall() {
  const { data: subscription, isLoading } = api.auth.getSubscription.useQuery(
    undefined,
    {
      retry: false,
    },
  );

  const { setOpen: setPaymentDialogOpen } = usePaymentDialogStore();
  const { setOpen: setResumeDialogOpen } = useResumeSubscriptionDialogStore();
  const { setOpen: setReactivateDialogOpen } = useReactivateDialogStore();

  useEffect(() => {
    if (isLoading || !subscription) return;

    // Check for paused subscription
    if (subscription.isPaused && !subscription.isPro) {
      setResumeDialogOpen(true);
      return;
    }

    // // TODO: Test the reactivate dialog and flow.
    // // Check for expired subscription that needs reactivation
    // // 1. Has a previous subscription ID
    // // 2. Subscription period has ended
    // // 3. Not paused (paused is handled above)
    // const needsReactivation =
    //   subscription.stripeSubscriptionId &&
    //   subscription.stripeCurrentPeriodEnd < Date.now() &&
    //   !subscription.isPaused;

    // if (needsReactivation) {
    //   setReactivateDialogOpen(true);
    //   return;
    // }

    // Check for no subscription case (new payment needed)
    if (
      !subscription.isPro &&
      !subscription.stripeCurrentPeriodEnd &&
      !subscription.appStoreCurrentPeriodEnd
    ) {
      setPaymentDialogOpen(true);
      return;
    }
  }, [
    subscription,
    isLoading,
    setPaymentDialogOpen,
    setResumeDialogOpen,
    setReactivateDialogOpen,
  ]);
}
