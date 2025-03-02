"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { resumeSubscription } from "@/lib/stripe/actions";
import { api } from "@/lib/trpc/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { create } from "zustand";

export const useResumeSubscriptionDialogStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function ResumeSubscriptionDialog({
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const { open, setOpen } = useResumeSubscriptionDialogStore();
  const [isLoading, setIsLoading] = useState(false);

  const { data: subscription } = api.auth.getSubscription.useQuery(undefined, {
    retry: false,
  });

  const handleResume = async () => {
    setIsLoading(true);

    try {
      // Resume the subscription - this sets a 10-minute temp window in the database
      await resumeSubscription();
      setOpen(false);
      router.refresh();

      toast.success("Subscription resumed", {
        description: "Your subscription has been successfully resumed.",
      });
    } catch (error) {
      toast.error("Failed to resume subscription", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} {...props}>
      <DialogContent
        closable={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
      >
        <DialogHeader>
          <div className="flex flex-col space-y-6 text-center">
            <Icons.logo className="mx-auto size-10" />
            <div className="flex flex-col space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">
                Resume Your Subscription
              </h1>
              <p className="text-lg text-secondary-foreground/70">
                Your subscription is paused.
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-md bg-muted p-4">
            <div className="flex items-start space-x-3">
              <Icons.info className="mt-0.5 size-5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  Your subscription is scheduled to resume on{" "}
                  {subscription?.resumeAt
                    ? format(new Date(subscription?.resumeAt), "MMMM d, yyyy")
                    : "a future date"}
                  .
                </p>
                <p>
                  Continuing will immediately resume your subscription and
                  billing will start immediately or once your trial ends.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between">
          <Button
            size="lg"
            variant="shadow"
            className="w-full text-base font-medium"
            onClick={handleResume}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 size-4 animate-spin" />
            )}
            Resume &rarr;
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
