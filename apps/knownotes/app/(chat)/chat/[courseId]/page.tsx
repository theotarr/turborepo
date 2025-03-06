import { Metadata } from "next";
import { ChatCourse } from "@/components/chat-course";
import { env } from "@/env";
import { AI } from "@/lib/chat/actions";
import { supabase } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/utils";
import { v1 as uuidv1 } from "uuid";

interface ChatPageProps {
  params: { courseId: string };
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { data: course } = await supabase
    .from("Course")
    .select("id, name")
    .eq("id", params.courseId)
    .single();
  if (!course) return {};

  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);
  ogUrl.searchParams.set("heading", course.name + " AI Tutor");
  ogUrl.searchParams.set("type", "AI Tutor");
  ogUrl.searchParams.set("mode", "light");

  const title = `${course.name} AI Tutor`;
  const description = `Your own personal AI tutor for ${course.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/chat/${course.id}`),
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

export default async function CourseChatPage({ params }: ChatPageProps) {
  const { data: course } = await supabase
    .from("Course")
    .select("*")
    .eq("id", params.courseId)
    .single();

  const chatId = uuidv1();
  const aiState = {
    chatId,
    messages: [],
  };

  return (
    <AI initialAIState={aiState}>
      <ChatCourse id={chatId} course={course} />
    </AI>
  );
}
