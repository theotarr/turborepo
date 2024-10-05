import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@acme/auth"
import { v1 as uuidv1 } from "uuid"

import { env } from "@/env"
import { AI } from "@/lib/chat/actions"
import { supabase } from "@/lib/supabase"
import { absoluteUrl } from "@/lib/utils"
import { ChatCourse } from "@/components/chat-course"

export const runtime = "edge"
export const maxDuration = 300 // 5 min in seconds

interface ChatPageProps {
  params: { courseId: string }
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { data: course } = await supabase
    .from("Course")
    .select("id, name")
    .eq("id", params.courseId)
    .single()
  if (!course) return {}

  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`)
  ogUrl.searchParams.set("heading", course.name + " AI Tutor")
  ogUrl.searchParams.set("type", "AI Tutor")
  ogUrl.searchParams.set("mode", "light")

  const title = course.name + " AI Tutor"
  const description = "Your own personal AI tutor for " + course.name

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
  }
}

export default async function CourseChatPage({ params }: ChatPageProps) {
  const session = await auth()
  if (!session) redirect("/login")

  const { data: course } = await supabase
    .from("Course")
    .select("*")
    .eq("id", params.courseId)
    .single()
  if (!course || course.userId !== session.user.id) redirect("/404")

  const chatId = uuidv1()
  const aiState = {
    chatId,
    messages: [],
  }

  return (
    // @ts-ignore
    <AI initialAIState={aiState}>
      <ChatCourse id={chatId} course={course} userId={session.user.id} />
    </AI>
  )
}
