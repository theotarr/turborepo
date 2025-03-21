import { CardSkeleton } from "@/components/card-skeleton";
import { DashboardHeader } from "@/components/header";
import { DashboardShell } from "@/components/shell";

export default function BillingLoading() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Billing"
        text="Manage your billing information."
      />
      <div className="grid gap-10">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </DashboardShell>
  );
}
