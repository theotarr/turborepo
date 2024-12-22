import { SubscriptionPlan } from "types";

// export const freePlan: SubscriptionPlan = {
//   name: "Class Clown",
//   description: "Try out KnowNotes for free with limited access.",
//   chatModel: "gpt-4o-mini",
//   lecturesPerMonth: 3,
//   noteGenerationsPerMonth: 10,
//   messagesPerMonth: 15,
// }

export const freePlan: SubscriptionPlan = {
  name: "Free Plan",
  description: "Try out KnowNotes for free with limited access.",
  stripePriceIds: [],
  chatModel: "gpt-4o",
  lecturesPerMonth: 30,
  noteGenerationsPerMonth: 500,
  messagesPerMonth: 500,
};

export const proPlan: SubscriptionPlan = {
  name: "KnowNotes Pro",
  description: "Access to all KnowNotes' features and powerful models.",
  stripePriceIds: [
    "price_1ObteaLB8OER9Cjf5hpps6bW",
    "price_1P8Wv4LB8OER9CjfJuUAuA8I",
  ],
  appStoreProductIds: ["weekly_5.99", "yearly_119.99"],
  chatModel: "gpt-4o",
  lecturesPerMonth: 1_000,
  noteGenerationsPerMonth: 1_000,
  messagesPerMonth: 1_000,
};
