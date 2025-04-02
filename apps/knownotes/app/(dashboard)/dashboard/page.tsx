import Link from "next/link";
import { redirect } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { CourseCreateDialog } from "@/components/course-create-dialog";
import { EmptyPlaceholder } from "@/components/empty-placeholder";
import { DashboardHeader } from "@/components/header";
import { LectureCreateActions } from "@/components/lecture-create-dialog";
import { LectureSearch } from "@/components/lecture-search";
import { QuickActions } from "@/components/quick-action";
import { DashboardShell } from "@/components/shell";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";
import { Course } from "@prisma/client";

import { auth } from "@acme/auth";

const title = "Dashboard";
const ogUrl = `${absoluteUrl("")}/api/og?heading=${title}&mode=light`;
const description = "Manage your lectures and courses.";

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
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

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
  });

  return (
    <>
      <LectureCreateActions
        userId={user?.id as string}
        courses={user?.courses as Course[]}
      />
      <DashboardShell>
        <DashboardHeader heading="Dashboard" text={description} />
        <div className="mb-8 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <QuickActions />
        </div>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2 px-1">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Lectures</span>
            </div>
            <LectureSearch courses={user?.courses} />
          </div>
          <div className="flex justify-center">
            <Link
              href="/dashboard/lectures"
              className="text-sm font-medium text-secondary-foreground hover:underline"
            >
              View all lectures
            </Link>
          </div>
        </div>
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
    </>
  );
}
