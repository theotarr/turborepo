"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";

import { Badge } from "./ui/badge";

type CourseCardProps = {
  course: Course & {
    _count: {
      lectures: number;
    };
  };
  className?: string;
};

export function CourseCard({ course, className, ...props }: CourseCardProps) {
  return (
    <Card className={cn("w-[340px] border", className)} {...props}>
      <CardHeader>
        <Link href={`/course/${course.id}`}>
          <CardTitle className="text-xl font-semibold tracking-tighter">
            {course.name}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="-mt-4 flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {course._count.lectures} lectures
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex space-x-4">
        <Link href={`/chat/${course.id}`}>
          <Button size="sm" variant="secondary">
            Chat with Course
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
