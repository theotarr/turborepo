import { Metadata } from "next";
import { NotesSharePage } from "@/components/notes-share-page";
import { env } from "@/env";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

interface LecturePageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: LecturePageProps): Promise<Metadata> {
  const lecture = await db.lecture.findUnique({
    where: {
      id: params.id,
    },
  });
  if (!lecture) return {};

  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);
  ogUrl.searchParams.set("heading", lecture.title);
  ogUrl.searchParams.set("type", "Course");
  ogUrl.searchParams.set("mode", "light");

  return {
    title: lecture.title,
    description: "View this lecture on KnowNotes.",
    openGraph: {
      title: lecture.title,
      description: "View this lecture on KnowNotes.",
      url: absoluteUrl(`/lecture/${lecture.id}`),
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: lecture.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: lecture.title,
      description: "View this lecture on KnowNotes.",
      images: [ogUrl.toString()],
    },
  };
}

export default async function SharePage({ params }: LecturePageProps) {
  const lecture = await db.lecture.findUnique({
    where: {
      id: params.id,
    },
    include: {
      course: true,
      messages: true,
    },
  });

  if (!lecture) return <>Loading...</>;

  return (
    <div className="flex flex-col overflow-hidden">
      <main className="mt-8 flex w-full flex-1 flex-col overflow-hidden">
        <NotesSharePage lecture={lecture} />
      </main>
    </div>
  );
}
