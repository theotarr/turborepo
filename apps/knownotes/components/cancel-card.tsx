"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { keepSubscription, pauseSubscription } from "@/lib/stripe/actions";
import { cn } from "@/lib/utils";
import { UserSubscriptionPlan } from "@/types";
import { toast } from "sonner";

interface CancelCardProps {
  subscriptionPlan: UserSubscriptionPlan & {
    isCanceled: boolean;
  };
}

export function CancelCard({ subscriptionPlan }: CancelCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);

  const handlePauseSubscription = async () => {
    try {
      setIsLoading(true);
      await pauseSubscription();
      setIsPauseDialogOpen(false);
      router.refresh();
      toast.success("Subscription paused");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscriptionPlan.isPro) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          {subscriptionPlan.isCanceled
            ? "Your subscription changes will take effect at the end of your billing cycle."
            : "Manage your subscription preferences here."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {subscriptionPlan.isCanceled ? (
            <div className="flex items-center gap-2">
              <Icons.info className="size-5 text-muted-foreground" />
              <p>
                Your current plan benefits will continue until the end of your
                billing period.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Icons.info className="size-5 text-muted-foreground" />
              <p>
                Any changes to your subscription will be applied at the end of
                your current billing cycle.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {subscriptionPlan.isCanceled ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              await keepSubscription();
              router.refresh();
              toast.success("Subscription restored", {
                description:
                  "Your subscription will not be cancelled at the end of the billing cycle.",
              });
            }}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 size-4 animate-spin" />
            )}
            Keep Subscription
          </Button>
        ) : (
          <Link
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "font-normal",
            )}
            href="/dashboard/billing/cancel"
          >
            Cancel Subscription
          </Link>
        )}
        {/* {!subscriptionPlan.isCanceled && (
          <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={isLoading}>
                Pause Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pause Subscription</DialogTitle>
                <DialogDescription>
                  Are you sure you want to pause your subscription? We'll
                  automatically resume your subscription 30 days from now.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPauseDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePauseSubscription}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Icons.spinner className="mr-2 size-4 animate-spin" />
                  )}
                  Confirm Pause
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )} */}
      </CardFooter>
    </Card>
  );
}
