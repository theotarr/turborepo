export function shouldShowPaywall(user: {
  stripeCurrentPeriodEnd?: string | null;
  appStoreCurrentPeriodEnd?: string | null;
}): boolean {
  /* Return true if the user doesn't have an active subscription. */
  // Check if the Stripe subscription is active
  if (
    user.stripeCurrentPeriodEnd &&
    new Date(user.stripeCurrentPeriodEnd).getTime() > new Date().getTime()
  )
    return false;

  // Check if the App Store subscription is active
  if (
    user.appStoreCurrentPeriodEnd &&
    new Date(user.appStoreCurrentPeriodEnd).getTime() > new Date().getTime()
  )
    return false;

  return true;
}
