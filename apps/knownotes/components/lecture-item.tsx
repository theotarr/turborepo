import Link from "next/link";
import { LectureOperations } from "@/components/lecture-operations";
import { formatLectureType, formatShortDate } from "@/lib/utils";

import { Badge } from "./ui/badge";

interface LectureItemProps {
  lecture: {
    id: string;
    title: string;
    type: string;
    updatedAt: Date;
    courseId: string | null;
    course?: {
      id: string;
      name: string;
    } | null;
  };
  courses?: Array<{
    id: string;
    name: string;
  }>;
}

export function LectureItem({ lecture, courses }: LectureItemProps) {
  return (
    <div className="group flex items-center justify-between p-4 hover:bg-muted/50">
      <div className="grid gap-1">
        <Link
          href={`/lecture/${lecture.id}`}
          className="font-semibold hover:underline"
        >
          {lecture.title}
        </Link>
        <div className="flex space-x-2 text-sm text-muted-foreground">
          {lecture.type && (
            <Badge variant="secondary">{formatLectureType(lecture.type)}</Badge>
          )}
          {lecture.course && (
            <Link href={`/course/${lecture.course.id}`}>
              <Badge variant="outline">{lecture.course.name}</Badge>
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <p className="text-xs text-muted-foreground">
          Updated {formatShortDate(lecture.updatedAt.toDateString())}
        </p>
        <LectureOperations lecture={lecture} courses={courses} />
      </div>
    </div>
  );
}
