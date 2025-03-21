"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { updateUserSubsciptionPlan } from "@/lib/stripe/actions";
import { api } from "@/lib/trpc/react";
import { create } from "zustand";

import { Icons } from "./icons";
import { PaymentElementsForm } from "./payment-element";

export const usePaymentDialogStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function PaymentDialog({
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const utils = api.useUtils();
  const searchParams = useSearchParams();
  const { open, setOpen } = usePaymentDialogStore();

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
    <>
      <Dialog open={open} {...props}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          closable={false}
        >
          <div className="flex flex-col space-y-6 text-center">
            <Icons.logo className="mx-auto h-12 w-12" />
            <div className="flex flex-col space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">
                Free For 72 Hours!
              </h1>
              <p className="text-lg text-secondary-foreground/70">
                Unlimited access, cancel anytime.
              </p>
            </div>
          </div>
          <PaymentElementsForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
