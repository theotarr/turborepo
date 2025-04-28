import { CardSkeleton } from "@/components/card-skeleton";
import { DashboardHeader } from "@/components/header";

export default function SettingsLoading() {
  return (
    <div className="grid items-start gap-8">
      <DashboardHeader
        heading="Settings"
        text="Manage your account settings."
      />
      <div className="grid gap-10">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
