"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { DashboardShell } from "@/components/shell";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cancelSubscription } from "@/lib/stripe/actions";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";

const CANCELLATION_REASONS = [
  {
    id: "too-expensive",
    label: "Too expensive",
    action: "discount",
  },
  {
    id: "too-complex",
    label: "Too complex",
    action: "tutorial",
  },
  {
    id: "transcription-accuracy",
    label: "Transcription isn't accurate",
    action: "info",
  },
  {
    id: "competitor",
    label: "Switching to a competitor",
    action: "feedback",
    requiresInput: true,
  },
  {
    id: "other",
    label: "Other reason",
    action: "feedback",
    requiresInput: true,
  },
];

export default function CancelSubscriptionPage() {
  const router = useRouter();
  const posthog = usePostHog();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedReasonData = CANCELLATION_REASONS.find(
    (r) => r.id === selectedReason,
  );
  const requiresInput = selectedReasonData?.requiresInput;

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setShowResponse(true);
      }, 1500); // 1.5 seconds of artificial loading time

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleCancel = async () => {
    setIsSubmitting(true);

    if (
      !showResponse &&
      (selectedReasonData?.action === "tutorial" ||
        selectedReasonData?.action === "info" ||
        selectedReasonData?.action === "discount")
    ) {
      // Show loading state before showing response
      setIsLoading(true);
      setIsSubmitting(false);
      return;
    }

    // Add a delay before showing the confirmation dialog
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowConfirmDialog(true);
      setIsSubmitting(false);
    }, 1000); // 1 second delay
  };

  const confirmCancellation = async () => {
    setIsSubmitting(true);
    try {
      // Use posthog to track cancellation feedback
      posthog.capture("subscription_cancelled", {
        reason: selectedReason,
        details: requiresInput ? otherReason : "",
      });

      await cancelSubscription();

      // For other actions, proceed with cancellation
      toast.success("Subscription cancelled", {
        description: "Your subscription has been cancelled successfully.",
      });

      router.push("/dashboard/billing");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const handleKeepSubscription = () => {
    router.push("/dashboard/billing");
    router.refresh();
  };

  return (
    <DashboardShell>
      {isLoading ? (
        <Card className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center space-y-4">
            <Icons.spinner className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Processing your feedback...
            </p>
          </div>
        </Card>
      ) : !showResponse ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Feedback</CardTitle>
            <CardDescription>
              We take pride in creating the best user experience. Please let us
              know why you're cancelling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Label htmlFor="reason">Why are you cancelling?</Label>
              <RadioGroup
                id="reason"
                value={selectedReason || ""}
                onValueChange={setSelectedReason}
                className="mt-3 space-y-3"
              >
                {CANCELLATION_REASONS.map((reason) => (
                  <div key={reason.id} className="flex items-start space-x-2">
                    <RadioGroupItem value={reason.id} id={reason.id} />
                    <Label htmlFor={reason.id} className="font-normal">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {requiresInput && (
              <div className="mt-4">
                <Label htmlFor="details">
                  {selectedReason === "competitor"
                    ? "Which competitor are you switching to?"
                    : "Please provide more details"}
                </Label>
                <Input
                  id="details"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder={
                    selectedReason === "competitor"
                      ? "I'm switching to..."
                      : "Describe your experience..."
                  }
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/dashboard/billing")}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleCancel}
              disabled={
                !selectedReason ||
                (requiresInput && !otherReason) ||
                isSubmitting
              }
            >
              {isSubmitting && (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              )}
              Continue
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            {selectedReasonData?.action === "discount" && (
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Icons.gift className="size-5 text-primary" />
                  Special Offer
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  We value your business! Would a 20% discount make you stay?
                </p>
                <div className="mt-4 rounded-md bg-primary/10 p-4">
                  <p className="text-sm font-medium">
                    Exclusive 20% off your subscription
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We'd love to keep you as a customer. Email us at{" "}
                    <a
                      href="mailto:support@knownotes.ai?subject=20%25%20Discount%20Request"
                      className="underline hover:text-primary"
                    >
                      support@knownotes.ai
                    </a>{" "}
                    to claim this special discount on your next billing cycle.
                  </p>
                </div>
              </div>
            )}
            {selectedReasonData?.action === "tutorial" && (
              <div>
                <CardTitle>Here's a quick tutorial</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  We're here to help you get the most out of KnowNotes. Click
                  the video to watch a quick tutorial (2 min on 2x). Or reach
                  out to us at{" "}
                  <a href="mailto:support@knownotes.ai" className="underline">
                    support@knownotes.ai
                  </a>{" "}
                  for help.
                </p>
                <div className="mx-auto mt-6 flex max-w-md items-center justify-center overflow-hidden rounded-lg shadow-lg">
                  <Link
                    href="https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528"
                    target="_blank"
                  >
                    <img
                      alt="KnowNotes Tutorial Video"
                      className="w-full"
                      src="https://cdn.loom.com/sessions/thumbnails/5f1fbb33b9a44d5ab2d61928d30af528-with-play.gif"
                    />
                  </Link>
                </div>
              </div>
            )}
            {selectedReasonData?.action === "info" && (
              <div>
                <CardTitle>Transcription Accuracy</CardTitle>
                <div className="mt-6 rounded-md bg-primary/10 p-4">
                  <div className="flex items-center gap-3">
                    <Icons.audioLines className="size-5 text-primary" />
                    <p className="text-sm font-medium">
                      Industry-leading accuracy
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We use the best AI transcription models available on the
                    market with a{" "}
                    <span className="font-bold">95% accuracy</span>.
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    If you're experiencing specific issues with transcription,
                    we'd love to hear about them so we can address them
                    directly. Please reach out to our support team at{" "}
                    <a href="mailto:support@knownotes.ai" className="underline">
                      support@knownotes.ai
                    </a>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancel Subscription
            </Button>
            <Button size="sm" onClick={handleKeepSubscription}>
              Keep Subscription
            </Button>
          </CardFooter>
        </Card>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose
              access to premium features at the end of your current billing
              period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              No, Keep My Subscription
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={confirmCancellation}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              )}
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
