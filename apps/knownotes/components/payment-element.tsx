"use client";

import type { StripeError } from "@stripe/stripe-js";
import { useState } from "react";
import { sendGAEvent } from "@/lib/analytics";
import getStripe from "@/lib/get-stripejs";
import { createSetupIntent } from "@/lib/stripe/actions";
import { cn } from "@/lib/utils";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Icons } from "./icons";
import { buttonVariants } from "./ui/button";

interface CheckoutFormProps extends React.HTMLAttributes<HTMLDivElement> {
  ctaText?: string;
}

function CheckoutForm({ className, ctaText, ...props }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [paymentType, setPaymentType] = useState<string>("");
  const [payment, setPayment] = useState<{
    status: "initial" | "processing" | "error";
  }>({ status: "initial" });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    try {
      e.preventDefault();
      // Abort if form isn't valid
      if (!e.currentTarget.reportValidity()) return;
      if (!elements || !stripe) return;
      setPayment({ status: "processing" });
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setPayment({ status: "error" });
        sendGAEvent("event", "payment_error_stripe", {
          paymentType,
          errorMessage: submitError.message ?? "An unknown error occurred",
        });
        setErrorMessage(submitError.message ?? "An unknown error occurred");
        return;
      }

      // Send a payment details event  GA.
      sendGAEvent("event", "add_payment_info", {
        paymentType,
      });

      // Create a SetupIntent.
      const { client_secret: clientSecret } = await createSetupIntent(
        window.promotekit_referral,
      );

      // Confirm the SetupIntent with the payment method.
      const return_url =
        window.location.pathname.startsWith("/lecture") ||
        window.location.pathname.startsWith("/chat")
          ? window.location.href
          : `${window.location.origin}/result`;

      const { error: confirmError } = await stripe!.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url,
        },
      });

      if (confirmError) {
        setPayment({ status: "error" });
        setErrorMessage(
          confirmError.message ??
            "An unknown error occurred. Please try again.",
        );
        toast.error(
          confirmError.message ??
            "An unknown error occurred. Please try again.",
        );
        console.error(confirmError);
      }
    } catch (err) {
      const { message } = err as StripeError;
      setPayment({ status: "error" });
      setErrorMessage(
        message ?? "An unknown error occurred. Please try again.",
      );
      toast.error(message ?? "An unknown error occurred. Please try again.");
    }
  };

  return (
    <div className={cn(className)} {...props}>
      <form onSubmit={handleSubmit}>
        <fieldset className="elements-style">
          <div className="FormRow elements-style antialiased">
            <PaymentElement
              onChange={(e) => {
                setPaymentType(e.value.type);
              }}
              options={{
                terms: {
                  applePay: "never",
                  auBecsDebit: "never",
                  bancontact: "never",
                  card: "never",
                  cashapp: "never",
                  googlePay: "never",
                  ideal: "never",
                  paypal: "never",
                  sepaDebit: "never",
                  sofort: "never",
                  usBankAccount: "never",
                },
              }}
            />
          </div>
        </fieldset>
        <button
          className={cn(
            buttonVariants({
              variant: "shadow",
              size: "lg",
            }),
            "mt-6 w-full text-base font-semibold",
          )}
          type="submit"
          disabled={
            !["initial", "succeeded", "error"].includes(payment.status) ||
            !stripe
          }
        >
          {payment.status === "processing" && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          {ctaText ?? <>Let's go! &rarr;</>}
        </button>
        <div className="mx-2 mt-2 text-xs text-secondary-foreground/70">
          By providing your payment information you agree to our terms of
          service and privacy policy.
        </div>
        {errorMessage && (
          <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}

interface PaymentElementsFormProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function PaymentElementsForm({
  className,
  ...props
}: PaymentElementsFormProps) {
  const { theme } = useTheme();
  return (
    <Elements
      stripe={getStripe()}
      options={{
        appearance: {
          variables: {
            borderRadius: "0.5rem",
            colorPrimary:
              theme === "dark"
                ? "hsl(217.2 91.2% 59.8%)"
                : "hsl(221.2 83.2% 53.3%)",
            colorTextPlaceholder:
              theme === "dark"
                ? "hsl(215 20.2% 65.1%)"
                : "hsl(215.4 16.3% 46.9%)",
            fontFamily:
              'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          },
          rules: {
            ".Input": {
              backgroundColor: "transparent",
              border:
                theme === "dark"
                  ? "1px solid hsl(217.2 32.6% 17.5%)"
                  : "2px solid hsl(214.3 31.8% 91.4%)",
            },
            ".Label": {
              color:
                theme === "dark"
                  ? "hsl(210 40% 98%)"
                  : "hsl(222.2 47.4% 11.2%)",
              fontWeight: "500",
            },
            ".Tab": {
              color:
                theme === "dark"
                  ? "hsl(210 40% 98%)"
                  : "hsl(222.2 47.4% 11.2%)",
              backgroundColor: "transparent",
            },
          },
        },
        currency: "usd",
        mode: "setup",
        setupFutureUsage: "off_session",
      }}
    >
      <CheckoutForm className={className} {...props} />
    </Elements>
  );
}
