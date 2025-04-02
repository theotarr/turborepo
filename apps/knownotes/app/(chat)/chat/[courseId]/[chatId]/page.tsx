import { Metadata } from "next";
import { ChatCourse } from "@/components/chat-course";
import { env } from "@/env";
import { AI } from "@/lib/chat/actions";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/utils";

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
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
  });
  if (!course) return <div>Course not found</div>;

  const chat = await db.chat.findUnique({
    where: {
      id: params.chatId,
    },
    include: {
      messages: true,
    },
  });
  if (!chat) return <div>Chat not found</div>;

  const aiState = {
    chatId: chat.id as string,
    messages: chat.messages.map((m) => ({
      id: m.id as string,
      role: m.role.toLowerCase() as
        | "function"
        | "user"
        | "assistant"
        | "system",
      content: m.content as string,
      sources: m.sources,
    })),
  };

  return (
    // @ts-ignore
    <AI initialAIState={aiState}>
      <ChatCourse id={chat.id} course={course} chatName={chat.name} />
    </AI>
  );
}
