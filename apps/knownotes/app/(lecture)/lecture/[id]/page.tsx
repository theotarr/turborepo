import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditableTitle } from "@/components/editable-title";
import { LectureOperations } from "@/components/lecture-operations";
import { NotesPage } from "@/components/notes-page";
import { PremiumFeature } from "@/components/premium-feature";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { buttonVariants } from "@/components/ui/button";
import { env } from "@/env";
import { convertToUIMessages } from "@/lib/ai/utils";
import { absoluteUrl, cn } from "@/lib/utils";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

interface LecturePageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: LecturePageProps): Promise<Metadata> {
  const lecture = await db.lecture.findUnique({
    where: {
      id: params.id,
    },
  });
  if (!lecture) return {};

  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);
  ogUrl.searchParams.set("heading", lecture.title);
  ogUrl.searchParams.set("type", "Course");
  ogUrl.searchParams.set("mode", "light");

  return {
    title: lecture.title,
    description: "View this lecture on KnowNotes.",
    openGraph: {
      title: lecture.title,
      description: "View this lecture on KnowNotes.",
      url: absoluteUrl(`/lecture/${lecture.id}`),
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: lecture.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: lecture.title,
      description: "View this lecture on KnowNotes.",
      images: [ogUrl.toString()],
    },
  };
}

export default async function LecturePage({ params }: LecturePageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const lecture = await db.lecture.findUnique({
    where: {
      id: params.id,
    },
    include: {
      course: true,
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
      flashcards: true,
      questions: true,
    },
  });

  const courses = await db.course.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!lecture) return notFound();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex h-16 items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2 overflow-hidden">
            <SidebarToggle />
            <EditableTitle lectureId={params.id} defaultTitle={lecture.title} />
          </div>
          <LectureOperations
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "size-8 border-none",
            )}
            lecture={{
              id: lecture.id,
              title: lecture.title,
              courseId: lecture.courseId || undefined,
            }}
            courses={courses || []}
          />
        </div>
      </div>
      <PremiumFeature>
        <NotesPage
          key={lecture.id}
          userId={session.user.id}
          initialMessages={convertToUIMessages(lecture.messages)}
          lecture={lecture}
        />
      </PremiumFeature>
    </div>
  );
}
