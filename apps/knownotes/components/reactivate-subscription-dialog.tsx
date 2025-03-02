"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/components/icons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { updateUserSubsciptionPlan } from "@/lib/stripe/actions";
import { api } from "@/lib/trpc/react";
import { create } from "zustand";

import { PaymentElementsForm } from "./payment-element";

export const useReactivateDialogStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function ReactivateSubscriptionDialog({
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const utils = api.useUtils();
  const searchParams = useSearchParams();
  const { open, setOpen } = useReactivateDialogStore();

  // Get subscription data from tRPC
  const { data: subscription, isLoading } = api.auth.getSubscription.useQuery(
    undefined,
    {
      retry: false,
    },
  );

  useEffect(() => {
    // If the search param contains `setup_intent` and there's no active subscription, handle it
    const setupIntentId = searchParams.get("setup_intent");

    if (setupIntentId) {
      async function updateSubscriptionSetupIntent(id: string) {
        await updateUserSubsciptionPlan(id);
        utils.auth.getSubscription.invalidate();
        router.refresh();
        setOpen(false);
      }

      updateSubscriptionSetupIntent(setupIntentId);
    }
  }, [router, searchParams, setOpen, subscription, isLoading]);

  return (
    <Dialog open={open} {...props}>
      <DialogContent
        closable={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <div className="flex flex-col space-y-6 text-center">
          <Icons.logo className="mx-auto h-12 w-12" />
          <div className="flex flex-col space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Reactivate Your Subscription
            </h1>
            <p className="text-lg text-secondary-foreground/70">
              Your subscription has ended. Please enter your payment details
              below to complete the reactivation.
            </p>
          </div>
        </div>
        <PaymentElementsForm />
      </DialogContent>
    </Dialog>
  );
}
