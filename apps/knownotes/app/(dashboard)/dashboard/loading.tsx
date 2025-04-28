import { Icons } from "@/components/icons";
import { ListItemSkeleton } from "@/components/list-item-skeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <Button variant="secondary" disabled>
          <Icons.add className="mr-2 h-4 w-4" />
          New lecture
        </Button>
      </div>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>

      <div>
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="divide-border-200 divide-y rounded-md border">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    </div>
  );
}
