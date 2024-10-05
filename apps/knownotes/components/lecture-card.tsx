import Link from "next/link"
import { Transcript } from "@/types"
import { Course, Lecture } from "@prisma/client"

import { cn, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { LectureOperations } from "./lecture-operations"
import { Badge } from "./ui/badge"

type LectureCardProps = {
  lecture: Lecture & {
    course: Course
  }
  courses?: Course[]
  className?: string
}

export function LectureCard({
  lecture,
  courses,
  className,
  ...props
}: LectureCardProps) {
  return (
    <Card className={cn("w-[340px] border", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold tracking-tighter">
          {lecture.title}
        </CardTitle>
        <LectureOperations lecture={lecture as any} courses={courses} />
      </CardHeader>
      <CardContent>
        <div className="-mt-6 font-medium text-muted-foreground">
          {formatDate(lecture.updatedAt.toDateString())}
        </div>
        <div className="my-4 flex items-center space-x-2">
          {lecture.course && lecture.course.name && (
            <Badge variant="secondary" className="text-xs">
              {lecture.course.name}
            </Badge>
          )}
        </div>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {(lecture.transcript as any as Transcript[])
            .map((p) => p.text)
            .join(" ")}
        </p>
      </CardContent>
      <CardFooter>
        <Link href={`/lecture/${lecture.id}`}>
          <Button variant={"secondary"}>View</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
