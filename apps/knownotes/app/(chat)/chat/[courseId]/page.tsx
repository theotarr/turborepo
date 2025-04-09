import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChatCourse } from "@/components/chat-course";
import { env } from "@/env";
import { absoluteUrl } from "@/lib/utils";
import { v1 as uuidv1 } from "uuid";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

interface ChatPageProps {
  params: { courseId: string };
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
  });
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
  const session = await auth();
  if (!session) return redirect("/login");

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
  });
  if (!course) return notFound();

  const chatId = uuidv1();

  return (
    <ChatCourse chatId={chatId} userId={session.user.id} course={course} />
  );
}
