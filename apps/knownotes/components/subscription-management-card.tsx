"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ResumeDatePicker } from "@/components/resume-date-picker";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { keepSubscription, pauseSubscription } from "@/lib/stripe/actions";
import { cn } from "@/lib/utils";
import { UserSubscriptionPlan } from "@/types";
import { addMonths, format } from "date-fns";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";

interface SubscriptionManagementCardProps {
  subscriptionPlan: UserSubscriptionPlan & {
    isCanceled: boolean;
    isPaused: boolean;
    resumeAt: number | null;
  };
}

export function SubscriptionManagementCard({
  subscriptionPlan,
}: SubscriptionManagementCardProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const [isLoading, setIsLoading] = useState(false);
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [pauseStep, setPauseStep] = useState<"date" | "feedback">("date");
  const [pauseReason, setPauseReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [resumeDate, setResumeDate] = useState<Date>(
    addMonths(new Date(), 1), // Default to 1 month
  );

  const handlePauseStepNext = () => {
    setPauseStep("feedback");
  };

  const handlePauseStepBack = () => {
    setPauseStep("date");
  };

  const handleResetSteps = () => {
    setPauseStep("date");
    setPauseReason("");
    setDetails("");
  };

  const handlePauseSubscription = async () => {
    try {
      setIsLoading(true);
      const reason = pauseReason === "other" ? details : pauseReason;

      // Pass the resume date to the server action
      await pauseSubscription(resumeDate);

      setIsPauseDialogOpen(false);
      router.refresh();

      // Reset steps for next time
      handleResetSteps();

      toast.success("Subscription paused", {
        description: `Your subscription will automatically resume on ${format(resumeDate, "PPP")}.`,
      });

      // Here you could send the feedback to your analytics or database
      posthog.capture("subscription_paused", {
        reason,
        details,
        resumeDate: resumeDate.toISOString(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsPauseDialogOpen(false);
    // Reset steps when closing
    handleResetSteps();
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
      <CardFooter className="flex justify-between gap-2">
        {!subscriptionPlan.isCanceled && (
          <Dialog
            open={isPauseDialogOpen}
            onOpenChange={(open) => {
              setIsPauseDialogOpen(open);
              if (!open) handleResetSteps();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" disabled={isLoading}>
                Pause Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pause Subscription</DialogTitle>
                <DialogDescription>
                  {pauseStep === "date"
                    ? "Choose when you'd like your subscription to automatically resume. You can pause your subscription for up to 3 months."
                    : "Help us improve by sharing why you're pausing your subscription."}
                </DialogDescription>
              </DialogHeader>

              {pauseStep === "date" ? (
                <>
                  <div className="py-4">
                    <div className="mb-4">
                      <Label htmlFor="resume-date">Resume Date</Label>
                      <ResumeDatePicker
                        value={resumeDate}
                        onChange={setResumeDate}
                      />
                    </div>
                    <div className="mt-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Icons.info className="mt-0.5 size-4" />
                        <p>
                          You'll maintain access until the end of your current
                          billing cycle. It will automatically resume on{" "}
                          <span className="font-medium text-foreground">
                            {format(resumeDate, "MMMM d, yyyy")}
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex justify-between gap-2 sm:justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePauseStepNext}
                    >
                      Continue
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <div className="py-4">
                    <RadioGroup
                      value={pauseReason}
                      onValueChange={setPauseReason}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="school_break"
                          id="school_break"
                        />
                        <Label htmlFor="school_break">Break from school</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="not_using" id="not_using" />
                        <Label htmlFor="not_using">
                          I'm not using it enough
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="missing_features"
                          id="missing_features"
                        />
                        <Label htmlFor="missing_features">
                          Missing features I need
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other">Other reason</Label>
                      </div>
                    </RadioGroup>

                    {pauseReason === "other" && (
                      <div className="mt-3">
                        <Textarea
                          placeholder="Please tell us more..."
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          className="h-20"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter className="flex justify-between gap-2 sm:justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePauseStepBack}
                    >
                      Back
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handlePauseSubscription}
                      disabled={isLoading || pauseReason === ""}
                    >
                      {isLoading && (
                        <Icons.spinner className="mr-2 size-4 animate-spin" />
                      )}
                      Pause Subscription
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}

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
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            href="/dashboard/billing/cancel"
          >
            Cancel Subscription
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
