import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-3xl flex-col space-y-12 pt-20 lg:pt-28">
      <div className="flex flex-col gap-4">
        {/* Main Heading Skeleton */}
        <Skeleton className="mx-auto h-10 w-3/4 sm:h-12 md:h-14" />

        {/* Quick Actions Skeleton */}
        <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" /> // Adjusted height for quick action cards
          ))}
        </div>
      </div>

      {/* Courses Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" /> {/* "Courses" heading */}
          <Skeleton className="h-9 w-32" /> {/* CourseCreateDialog button */}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" /> // CourseCard skeleton
          ))}
        </div>
      </div>

      {/* Recent Notes Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20" /> {/* "Recent" heading */}
          <Skeleton className="h-5 w-16" /> {/* "View all" link */}
        </div>
        <Skeleton className="h-10 w-full" />{" "}
        {/* LectureSearch input skeleton */}
      </div>

      {/* Lecture Create Actions Skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Skeleton className="h-10 w-full sm:w-40" />
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>
    </div>
  );
}
