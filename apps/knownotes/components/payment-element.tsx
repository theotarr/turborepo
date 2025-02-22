"use client";

import type { StripeError } from "@stripe/stripe-js";
import { useState } from "react";
import { sendGAEvent } from "@/lib/analytics";
import getStripe from "@/lib/get-stripejs";
import { createSetupIntent, validatePromotionCode } from "@/lib/stripe/actions";
import { cn } from "@/lib/utils";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { Icons } from "./icons";
import { buttonVariants } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CheckoutFormProps extends React.HTMLAttributes<HTMLDivElement> {}

function CheckoutForm({ className, ...props }: CheckoutFormProps) {
  const { theme } = useTheme();
  const [paymentType, setPaymentType] = useState<string>("");
  const [payment, setPayment] = useState<{
    status: "initial" | "processing" | "error";
  }>({ status: "initial" });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [promoCode, setPromoCode] = useState<string>("");
  const [promoCodeMessage, setPromoCodeMessage] = useState<{
    status: "applied" | "error";
    message: string;
  } | null>(null);
  const debouncedPromoCode = useDebouncedCallback(async (promoCode: string) => {
    if (!promoCode) {
      setPromoCodeMessage(null);
      return;
    }

    const { valid } = await validatePromotionCode(promoCode);
    if (valid) {
      setPromoCodeMessage({
        status: "applied",
        message: `Promo code applied! You get your first week free!`,
      });
      toast.success(`Promo code applied! You get your first week free!`);
    } else {
      setPromoCodeMessage({
        status: "error",
        message: `Invalid promo code`,
      });
      toast.error("Invalid promo code");
    }
  }, 500);

  const stripe = useStripe();
  const elements = useElements();

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
    <>
      <div
        className={cn("flex flex-col space-y-6 text-center", className)}
        {...props}
      >
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
        {/* <div
          className="pt-2 transition-all"
          style={{
            fontFamily:
              'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          }}
        >
          <Label
            className="mb-1 text-[0.93rem] font-[400] leading-4"
            style={{
              color:
                theme === "dark"
                  ? "hsl(210 40% 98%)"
                  : "hsl(222.2 47.4% 11.2%)",
            }}
            htmlFor="promoCode"
          >
            Promo code
          </Label>
          <Input
            name="promoCode"
            placeholder="Enter promo code"
            value={promoCode}
            className="h-11 shadow-sm transition-all duration-75 placeholder:text-base focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(e) => {
              setPromoCode(e.target.value)
              debouncedPromoCode(e.target.value)
            }}
          />
          {promoCodeMessage && (
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                promoCodeMessage.status === "applied"
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              {promoCodeMessage.message}
            </p>
          )}
        </div> */}
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
          Let&apos;s go! &rarr;
        </button>
        <div className="mx-2 mt-2 text-xs text-secondary-foreground/70">
          By providing your payment information you agree to our terms of
          service and privacy policy.
        </div>
        {errorMessage && (
          <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
        )}
      </form>
    </>
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
        // amount: 99, // in cents = $0.99
        setupFutureUsage: "off_session",
      }}
    >
      <CheckoutForm className={className} {...props} />
    </Elements>
  );
}
