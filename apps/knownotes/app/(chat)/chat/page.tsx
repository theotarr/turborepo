import { redirect } from "next/navigation";
import { ChatCourse } from "@/components/chat-course";
import { v1 as uuidv1 } from "uuid";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

export default async function ChatPage() {
  const session = await auth();
  if (!session) return redirect("/login");

  const courses = await db.course.findMany({
    where: {
      userId: session.user.id,
    },
  });

  const chatId = uuidv1();

  return (
    <ChatCourse chatId={chatId} userId={session.user.id} courses={courses} />
  );
}
