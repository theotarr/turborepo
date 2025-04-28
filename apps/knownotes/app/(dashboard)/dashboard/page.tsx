import Link from "next/link";
import { redirect } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { CourseCreateDialog } from "@/components/course-create-dialog";
import { EmptyPlaceholder } from "@/components/empty-placeholder";
import { Icons } from "@/components/icons";
import { LectureCreateActions } from "@/components/lecture-create-dialog";
import { LectureSearch } from "@/components/lecture-search";
import { QuickActions } from "@/components/quick-action";
import { buttonVariants } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/utils";
import { Course } from "@prisma/client";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

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
    <div className="mx-auto max-w-3xl space-y-12 pt-16">
      <h1 className="text-center text-3xl font-semibold tracking-tight">
        What do you want to learn today?
      </h1>

      <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickActions />
      </div>

      {/* Courses section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Courses</h2>
          <CourseCreateDialog
            className={buttonVariants({
              variant: "outline",
              size: "sm",
            })}
          />
        </div>

        {user?.courses.length! > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {user?.courses.map((course) => (
              <CourseCard className="w-full" key={course.id} course={course} />
            ))}
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
      </div>

      {/* Recent notes section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent</h2>
          <Link
            href="/library?tab=notes"
            className="text-sm font-medium text-secondary-foreground hover:underline"
          >
            View all
          </Link>
        </div>
        <LectureSearch courses={user?.courses} />
      </div>

      <LectureCreateActions
        userId={user?.id as string}
        courses={user?.courses as Course[]}
      />
    </div>
  );
}
