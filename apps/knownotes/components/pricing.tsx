"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { proPlan } from "@/config/subscriptions";
import { sendGAEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const paidPlan = {
  name: "KnowNotes Pro",
  priceIds: proPlan.stripePriceIds,
  price: "Try For Free",
  description: "Access to all KnowNotes' features and powerful models.",
  features: [
    "Unlimited lectures",
    "Upload files/YT videos",
    "Unlimited AI notes",
    "Unlimited AI answers",
    "Unlimited AI quizzes",
  ],
  buttonText: "Get Started",
};

export function PricingSection() {
  return (
    <section className="container flex flex-col gap-6 py-8 md:max-w-[64rem] md:py-12 lg:py-24">
      <div className="mx-auto flex w-full flex-col gap-4">
        <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl">
          Pricing
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Unlock all premium features to get the most out of your reading and
          writing.
        </p>
        <PricingCard />
      </div>
    </section>
  );
}

export function PricingCard({
  className,
  ...props
}: {
  className?: string;
  [key: string]: any;
}) {
  useEffect(() => {
    const handleScroll = () => {
      const pricingCard = document.getElementById("pricing-card");
      if (pricingCard) {
        const rect = pricingCard.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        if (isVisible) sendGAEvent("event", "scroll_to_pricing_card");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={className} {...props}>
      <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:max-w-xl">
        <div
          id="pricing-card"
          className="flex flex-col justify-center rounded-3xl px-4 py-6 ring ring-primary"
        >
          <span className="text-center leading-6 text-secondary-foreground">
            72 Hours Unlimited Access
          </span>
          <p className="mt-6 text-center text-5xl font-bold tracking-tight text-secondary-foreground">
            Try For <span className="text-primary">Free</span>
          </p>
          <div className="mt-6 flex items-center justify-center text-center text-sm font-medium text-secondary-foreground">
            <Icons.zap
              className="mr-2 size-4 fill-secondary-foreground"
              aria-hidden="true"
            />
            Offer valid until
            <span className="ml-1 font-semibold text-primary">
              {new Date(
                Date.now() + 2 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </span>
          </div>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "shadow", size: "lg" }),
              "mx-8 mt-4 inline-flex h-14 rounded-xl px-3 py-2 text-center text-xl font-semibold leading-6",
            )}
          >
            {paidPlan.buttonText}
            <Icons.arrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
          <ul
            role="list"
            className="mx-auto mt-8 space-y-3 text-sm leading-6 text-secondary-foreground"
          >
            {paidPlan.features.map((feature) => (
              <li key={feature} className="flex gap-x-3 font-medium">
                <Icons.check
                  className="size-6 flex-none text-primary"
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center text-xs text-secondary-foreground/60">
            Cancel Anytime{" "}
            <span className="hidden lg:inline">| Satisfaction Guarantee</span> |
            Renews at $5.99<span className="hidden lg:inline">/wk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
