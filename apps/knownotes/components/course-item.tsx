import Link from "next/link"
import { Course } from "@prisma/client"

import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Icons } from "@/components/icons"

import { CourseOperations } from "./course-operations"

interface CourseItemProps {
  course: Course
}

export function CourseItem({ course }: CourseItemProps) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex flex-col items-start gap-1">
        <Link
          href={`/course/${course.id}`}
          className="font-semibold hover:underline"
        >
          {course.name}
        </Link>
        <div className="flex space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Icons.calendar className="mr-1 inline-block size-3" />
            {formatDate(course.updatedAt.toDateString())}
          </div>
        </div>
      </div>
      <CourseOperations course={course} />
    </div>
  )
}

CourseItem.Skeleton = function CourseItemSkeleton() {
  return (
    <div className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}
