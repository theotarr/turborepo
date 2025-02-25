import { Metadata } from "next";
import { ChatCourse } from "@/components/chat-course";
import { env } from "@/env";
import { AI } from "@/lib/chat/actions";
import { supabase } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/utils";

export const runtime = "edge";
// export const maxDuration = 60; // 1 min in seconds

interface SavedChatPageProps {
  params: { courseId: string; chatId: string };
}

export async function generateMetadata({
  params,
}: SavedChatPageProps): Promise<Metadata> {
  const { data: course } = await supabase
    .from("Course")
    .select("id, name")
    .eq("id", params.courseId)
    .single();
  if (!course) return {};

  const chat = params.chatId
    ? (
        await supabase
          .from("Chat")
          .select("id, name")
          .eq("id", params.chatId)
          .single()
      ).data
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
  const { data: course } = await supabase
    .from("Course")
    .select("*")
    .eq("id", params.courseId)
    .single();

  const { data: chat } = await supabase
    .from("Chat")
    .select("*, Message(*)")
    .eq("id", params.chatId)
    .single();

  // Convert chat.Message to chat.messages
  chat.messages = chat.Message;
  delete chat.Message;

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
