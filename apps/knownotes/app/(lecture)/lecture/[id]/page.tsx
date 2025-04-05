import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EditableTitle } from "@/components/editable-title";
import { Icons } from "@/components/icons";
import { LectureOperations } from "@/components/lecture-operations";
import { NotesPage } from "@/components/notes-page";
import { PremiumFeature } from "@/components/premium-feature";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAccountNav } from "@/components/user-account-nav";
import { env } from "@/env";
import { db } from "@/lib/db";
import { absoluteUrl, cn } from "@/lib/utils";
import { Transcript } from "@/types";
import { Attachment, UIMessage } from "ai";

import type { Message } from "@acme/db";
import { auth } from "@acme/auth";

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

  function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage["parts"],
      role: message.role.toLowerCase() as UIMessage["role"],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: "",
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center space-x-2 overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className={cn(buttonVariants({ variant: "ghost" }), "p-1")}
                  >
                    <Icons.chevronLeft className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Back to dashboard</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <EditableTitle lectureId={params.id} initialTitle={lecture.title} />
          </div>
          <div className="flex flex-1 items-center sm:justify-end">
            <div className="ml-4 flex flex-1 justify-end space-x-4 sm:grow-0">
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
                  transcript: lecture.transcript as unknown as Transcript[],
                }}
                courses={courses || []}
              />
              <UserAccountNav
                user={{
                  name: session.user.name,
                  image: session.user.image,
                  email: session.user.email,
                }}
              />
            </div>
          </div>
        </div>
      </header>
      <main>
        <PremiumFeature>
          <NotesPage
            userId={session.user.id}
            initialMessages={convertToUIMessages(lecture.messages)}
            lecture={lecture}
          />
        </PremiumFeature>
      </main>
    </div>
  );
}
