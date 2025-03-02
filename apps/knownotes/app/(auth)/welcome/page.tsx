import { redirect } from "next/navigation";
import { Icons } from "@/components/icons";
import { PaymentElementsForm } from "@/components/payment-element";
import { getUserSubscriptionPlan } from "@/lib/subscription";

import { auth } from "@acme/auth";

export const metadata = {
  title: "Welcome to KnowNotes!",
  description:
    "Thanks for joining us! We'd love to hear about your needs and how we can help you.",
};

export default async function WelcomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const subscription = await getUserSubscriptionPlan(session.user.id);

  if (subscription.isPro) {
    // already subscribed, redirect to dashboard
    redirect("/dashboard");
  }

  return (
    <div className="container grid h-screen w-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="hidden h-full bg-muted lg:block" />
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-6 text-center">
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
          <PaymentElementsForm />
        </div>
      </div>
    </div>
  );
}
