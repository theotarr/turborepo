import { redirect } from "next/navigation";
import { Library } from "@/components/library";

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
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground">
          Browse your notes and chats all in one place
        </p>
      </div>
      <Library
        lectures={lectures}
        chats={chats}
        courses={courses}
        defaultTab={defaultTab}
      />
    </>
  );
}
