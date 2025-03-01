"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { updateUserSubsciptionPlan } from "@/lib/stripe/actions";
import { UserSubscriptionPlan } from "@/types";
import { create } from "zustand";

import { PaymentElementsForm } from "./payment-element";

export const usePaymentDialogStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

interface PaymentDialogProps extends React.ComponentPropsWithoutRef<"div"> {
  subscription: UserSubscriptionPlan;
}

export function PaymentDialog({ subscription, ...props }: PaymentDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { open, setOpen } = usePaymentDialogStore();

  useEffect(() => {
    // If the search param contains `setup_intent`, then run the server action to update the user's subscription plan.
    const setupIntentId = searchParams.get("setup_intent");

    async function updateSubscrptionSetupIntent(id: string) {
      await updateUserSubsciptionPlan(id);
      router.refresh();
    }

    // If there is no subscription, open the dialog
    if (
      !subscription.isPro &&
      !subscription.stripeCurrentPeriodEnd &&
      !subscription.appStoreCurrentPeriodEnd
    ) {
      setOpen(true); // not subscribed, open the payment dialog to subscribe

      if (setupIntentId) {
        // If the setup intent is present, the user was redirected from Stripe and has completed the setup intent.
        updateSubscrptionSetupIntent(setupIntentId);
        setOpen(false);
      }
    }
  }, [router, searchParams, setOpen, subscription]);

  return (
    <>
      <Dialog open={true} {...props}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          closable={false}
        >
          <PaymentElementsForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
