import { Metadata } from "next";
import Link from "next/link";
import { CourseOperations } from "@/components/course-operations";
import { EmptyPlaceholder } from "@/components/empty-placeholder";
import { DashboardHeader } from "@/components/header";
import { Icons } from "@/components/icons";
import { LectureItem } from "@/components/lecture-item";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { absoluteUrl } from "@/lib/utils";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

interface CoursePageProps {
  params: { courseId: string };
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const course = await db.course.findUnique({
    where: { id: params.courseId },
  });
  if (!course) return {};

  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);
  ogUrl.searchParams.set("heading", course.name);
  ogUrl.searchParams.set("type", "Course");
  ogUrl.searchParams.set("mode", "light");

  return {
    title: course.name,
    description: "View this course's lectures on KnowNotes.",
    openGraph: {
      title: course.name,
      description: "View this course's lectures on KnowNotes.",
      url: absoluteUrl(`/course/${course.id}`),
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: course.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: course.name,
      description: "View this course's lectures on KnowNotes.",
      images: [ogUrl.toString()],
    },
  };
}

export default async function CoursePage({ params }) {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session?.user.id },
    include: {
      courses: true,
    },
  });

  const course = await db.course.findFirst({
    where: { id: params.courseId },
    include: {
      lectures: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!course) return <>Loading...</>;

  return (
    <div className="grid items-start gap-8">
      <DashboardHeader
        heading={course.name}
        text="View this course's lectures."
      >
        <div className="flex items-center space-x-6">
          {/* <FileUpload /> */}
          <Link href={`/lecture?courseId=${course.id}`}>
            <Button variant="secondary" size="sm">
              <Icons.add className="mr-2 h-4 w-4" />
              New lecture
            </Button>
          </Link>
          <CourseOperations course={course} />
        </div>
      </DashboardHeader>
      <div>
        {course.lectures?.length ? (
          <div className="divide-y divide-border rounded-md border">
            {course.lectures.map((lecture) => (
              <LectureItem
                key={lecture.id}
                lecture={lecture}
                courses={user?.courses}
              />
            ))}
          </div>
        ) : (
          <EmptyPlaceholder>
            <EmptyPlaceholder.Icon name="messageSquareText" />
            <EmptyPlaceholder.Title>No lectures</EmptyPlaceholder.Title>
            <EmptyPlaceholder.Description>
              You don&apos;t have any lectures yet. Click the button below to
              create this course&apos;s first lecture.
            </EmptyPlaceholder.Description>
            <Link href={`/lecture?courseId=${course.id}`}>
              <Button>
                <Icons.add className="mr-2 h-4 w-4" />
                New lecture
              </Button>
            </Link>
          </EmptyPlaceholder>
        )}
      </div>
    </div>
  );
}
