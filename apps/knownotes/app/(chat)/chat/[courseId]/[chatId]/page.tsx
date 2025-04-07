import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChatCourse } from "@/components/chat-course";
import { env } from "@/env";
import { convertToUIMessages } from "@/lib/ai/utils";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

import { auth } from "@acme/auth";

interface SavedChatPageProps {
  params: { courseId: string; chatId: string };
}

export async function generateMetadata({
  params,
}: SavedChatPageProps): Promise<Metadata> {
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
  });
  if (!course) return {};

  const chat = params.chatId
    ? await db.chat.findUnique({
        where: {
          id: params.chatId,
        },
      })
    : null;

  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);
  ogUrl.searchParams.set("heading", course.name + " AI Tutor");
  ogUrl.searchParams.set("type", "AI Tutor");
  ogUrl.searchParams.set("mode", "light");

  const title = chat ? chat.name : course.name + " AI Tutor";
  const description = "Your own personal AI tutor for " + course.name;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: chat
        ? absoluteUrl(`/chat/${course.id}/${chat?.id}`)
        : absoluteUrl(`/chat/${course.id}`),
      images: [
        {
          url: ogUrl.toString(),
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
      images: [ogUrl.toString()],
    },
  };
}

export default async function CourseChatPage({ params }: SavedChatPageProps) {
  const session = await auth();
  if (!session) return redirect("/login");

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
  });
  if (!course) return notFound();

  const chat = await db.chat.findUnique({
    where: {
      id: params.chatId,
    },
    include: {
      messages: true,
    },
  });
  if (!chat) return notFound();

  return (
    <ChatCourse
      id={chat.id}
      userId={session.user.id}
      course={course}
      initialMessages={convertToUIMessages(chat.messages)}
    />
  );
}
