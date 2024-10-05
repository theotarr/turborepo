import { redirect } from "next/navigation"
import { auth } from "@acme/auth"

import { db } from "@/lib/db"
import { absoluteUrl } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { CourseCard } from "@/components/course-card"
import { CourseCreateDialog } from "@/components/course-create-dialog"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { DashboardHeader } from "@/components/header"
import { LectureCreateDialog } from "@/components/lecture-create-dialog"
import {
  QuickChat,
  QuickLecture,
  QuickYoutubeImport as QuickUpload,
} from "@/components/quick-action-new"
import { DashboardShell } from "@/components/shell"
import { LectureItem } from "@/components/lecture-item"
import Link from "next/link"
import { Course } from "@prisma/client"

const title = "Dashboard"
const ogUrl = `${absoluteUrl("")}/api/og?heading=${title}&mode=light`
const description = "Manage your lectures and courses."

export const metadata = {
  title,
  description,
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    title,
    description,
    url: absoluteUrl("/dashboard"),
    images: [
      {
        url: ogUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogUrl],
  },
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      courses: {
        include: {
          _count: {
            select: { lectures: true },
          },
        },
      },
    },
  })
  const lectures = await db.lecture.findMany({
    where: { userId: session.user.id },
    include: {
      course: true,
    },
    // Limit to 6 lectures, otherwise with a ton of lectures and transcripts the request will time out or exceed maximum request size for 1 request.
    take: 6,
    orderBy: { updatedAt: "desc" },
  })

  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text={description} />
      <ScrollArea className="pb-4">
        <div className="flex w-max space-x-4 md:w-fit">
          <QuickLecture />
          <QuickChat />
          <QuickUpload />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {lectures?.length ? (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Recent Lectures</span>
            <LectureCreateDialog
              userId={session.user.id}
              courses={user?.courses as Course[]}
              className="hidden"
            />
          </div>
          <div className="divide-y divide-border rounded-md border">
            {lectures.slice(0, 6).map((lecture) => (
              <LectureItem
                key={lecture.id}
                lecture={lecture as any}
                courses={user?.courses}
              />
            ))}
          </div>
          {lectures.length > 1 && (
            <div className="mt-6 flex justify-center">
              <Link
                href="/dashboard/lectures"
                className="text-sm font-medium text-secondary-foreground hover:underline"
              >
                View all lectures
              </Link>
            </div>
          )}
        </div>
      ) : (
        <LectureCreateDialog
          userId={session.user.id}
          courses={user?.courses ?? []}
          className="hidden"
        />
      )}
      {user?.courses.length! > 0 ? (
        <div className="flex flex-col space-y-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-lg font-medium">Courses</span>
            <div className="flex flex-col gap-4 sm:flex-row">
              <CourseCreateDialog
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {user?.courses.map((course) => (
              <CourseCard
                className="w-full sm:w-[340px]"
                key={course.id}
                course={course}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="folder" />
          <EmptyPlaceholder.Title>
            Add a course to get started
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            You can group your lectures and notes by course, click here to add
            one.
          </EmptyPlaceholder.Description>
          <CourseCreateDialog
            className={buttonVariants({
              variant: "default",
              size: "sm",
            })}
          />
        </EmptyPlaceholder>
      )}
    </DashboardShell>
  )
}
