import { redirect } from "next/navigation";
import { ChatItem } from "@/components/chat-item";
import { LectureItem } from "@/components/lecture-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { auth } from "@acme/auth";
import { db } from "@acme/db";

export const metadata = {
  title: "Library",
  description: "Browse your notes and chats all in one place",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session) return redirect("/login");

  const defaultTab = searchParams.tab === "chats" ? "chats" : "notes";

  const lectures = await db.lecture.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      fileId: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      courseId: true,
      course: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const chats = await db.chat.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      course: true,
    },
  });

  const courses = await db.course.findMany({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <div className="container pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground">
          Browse your notes and chats all in one place
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <div className="overflow-hidden rounded-lg border">
            {lectures && lectures.length > 0 ? (
              lectures.map((lecture) => (
                <LectureItem
                  key={lecture.id}
                  lecture={lecture}
                  courses={courses}
                />
              ))
            ) : (
              <div className="flex min-h-[200px] items-center justify-center p-4 text-center text-muted-foreground">
                No notes found. Create a new note to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="chats">
          <div className="overflow-hidden rounded-lg border">
            {chats && chats.length > 0 ? (
              chats.map((chat) => <ChatItem key={chat.id} chat={chat} />)
            ) : (
              <div className="flex min-h-[200px] items-center justify-center p-4 text-center text-muted-foreground">
                No chats found. Start a new chat to get started.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
