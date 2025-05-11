import { SubscriptionPlan } from "types";

// Free plan.
export const freePlan: SubscriptionPlan = {
  planName: "Free",
  description: "Try out KnowNotes for free with limited access.",
  stripePriceIds: [],
};

// KnowNotes Pro.
export const proPlan: SubscriptionPlan = {
  planName: "KnowNotes Pro",
  description: "Access to all KnowNotes' features and powerful models.",
  stripePriceIds:
    process.env.NODE_ENV === "development"
      ? // Development prices
        ["price_1ObsJnLB8OER9CjfsU27aNqX"]
      : [
          // Production prices
          "price_1ObteaLB8OER9Cjf5hpps6bW",
          "price_1P8Wv4LB8OER9CjfJuUAuA8I",
        ],
  appStoreProductIds: [
    "weekly_5.99",
    "yearly_119.99",
    "yearly_99.99",
    "yearly_139.99",
    "monthly_18.99",
    "offer_89.99",
  ],
};
