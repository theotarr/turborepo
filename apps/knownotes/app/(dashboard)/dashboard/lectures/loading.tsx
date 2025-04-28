import { DashboardHeader } from "@/components/header";
import { Icons } from "@/components/icons";
import { ListItemSkeleton } from "@/components/list-item-skeleton";
import { Button } from "@/components/ui/button";

export default function LecturesLoading() {
  return (
    <div className="grid items-start gap-8">
      <DashboardHeader heading="Lectures" text="View and manage your lectures.">
        <Button variant={"secondary"}>
          <Icons.add className="mr-2 h-4 w-4" />
          New lecture
        </Button>
      </DashboardHeader>
      <div className="divide-border-200 divide-y rounded-md border">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    </div>
  );
}
