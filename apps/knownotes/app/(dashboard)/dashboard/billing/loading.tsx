import { CardSkeleton } from "@/components/card-skeleton";
import { DashboardHeader } from "@/components/header";

export default function BillingLoading() {
  return (
    <div className="grid items-start gap-8">
      <DashboardHeader
        heading="Billing"
        text="Manage your billing information."
      />
      <div className="grid gap-10">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
