"use client"

import * as React from "react"
import { Course } from "@prisma/client"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { createCourse } from "@/app/(auth)/actions"

import { CourseItem } from "./course-item"

interface AddCoursesFormProps extends React.HTMLAttributes<HTMLDivElement> {
  courses: Course[]
}

export function AddCoursesForm({
  courses,
  className,
  ...props
}: AddCoursesFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [courseName, setCourseName] = React.useState<string>("")
  const [courseList, setCourseList] = React.useState<Course[]>(courses)

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <div className="mt-4 flex flex-col items-start gap-1.5">
        <Label htmlFor="course-name">Course Name</Label>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Add a course"
            type="text"
            autoCapitalize="none"
            name="course-name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={async () => {
              setIsLoading(true)
              const course = await createCourse(courseName)
              setCourseList((prev) => [...prev, course])
              setCourseName("")
              setIsLoading(false)
            }}
            className={cn(buttonVariants())}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add
          </button>
        </div>
      </div>
      {courseList.length > 0 ? (
        <div className="divide-y divide-border rounded-md border">
          {courseList.map((course) => (
            <CourseItem course={course} key={course.id} />
          ))}
        </div>
      ) : (
        <></>
      )}
    </div>
  )
}
