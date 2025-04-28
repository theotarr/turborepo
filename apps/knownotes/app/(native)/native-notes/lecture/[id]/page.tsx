import { notFound } from "next/navigation";
import { NativeNotesPage } from "@/components/native-notes";
import { JSONContent } from "@tiptap/core";

import { db } from "@acme/db";

interface LecturePageProps {
  params: { id: string };
}

export default async function NativePage({ params }: LecturePageProps) {
  const lecture = await db.lecture.findUnique({
    where: {
      id: params.id,
    },
  });
  if (!lecture) return notFound();

  return (
    <NativeNotesPage
      lecture={{
        id: lecture.id,
        enhancedNotes: lecture.enhancedNotes as JSONContent,
        markdownNotes: lecture.markdownNotes as string,
      }}
    />
  );
}
