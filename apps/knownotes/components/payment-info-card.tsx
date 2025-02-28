"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { capitalize } from "@/lib/utils";
import { toast } from "sonner";
import Stripe from "stripe";

import { Badge } from "./ui/badge";

interface PaymentInfoCardProps {
  paymentMethods: (Stripe.PaymentMethod & {
    isDefaultPaymentMethod: boolean;
  })[];
}

export function PaymentInfoCard({ paymentMethods }: PaymentInfoCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpdatePayment() {
    setIsLoading(true);

    try {
      // Get a Stripe session URL
      const response = await fetch("/api/users/stripe");

      if (!response?.ok) {
        return toast.error(
          "Something went wrong. Please refresh the page and try again.",
        );
      }

      // Redirect to the Stripe portal
      const session = await response.json();
      if (session) {
        window.location.href = session.url;
      }
    } catch (error) {
      toast.error("Failed to update payment information");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>
          Payments are made using the default card on file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-4">
                <div className="rounded-full bg-muted p-2">
                  <Icons.billing className="size-5 text-secondary-foreground" />
                </div>
                <div className="space-y-1">
                  {method.type === "card" && method.card ? (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium leading-none">
                          {capitalize(method.card.brand)} ••••{" "}
                          {method.card.last4}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires {method.card.exp_month}/{method.card.exp_year}
                        </p>
                      </div>{" "}
                      {method.isDefaultPaymentMethod && (
                        <div className="ml-2 flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          <Icons.check className="mr-1 size-4 text-primary" />
                          Default
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                        {capitalize(method.type)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-muted p-2">
              <Icons.billing className="size-5 text-secondary-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No payment method on file
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button size="sm" onClick={handleUpdatePayment} disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 size-4 animate-spin" />}
          Update Payment Info
        </Button>
      </CardFooter>
    </Card>
  );
}
