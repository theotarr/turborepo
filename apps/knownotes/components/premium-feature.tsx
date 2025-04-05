"use client";

import { usePaywall } from "@/hooks/use-paywall";

interface PremiumFeatureProps {
  children: React.ReactNode;
}

export function PremiumFeature({ children }: PremiumFeatureProps) {
  usePaywall(); // Show the correct paywall based on the user subscription status.
  return children;
}
