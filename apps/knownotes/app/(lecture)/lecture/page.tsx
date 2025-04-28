import { redirect } from "next/navigation";
import { absoluteUrl } from "@/lib/utils";

import { createLecture } from "../actions";

const title = "Record Lecture";
const ogUrl = `${absoluteUrl("")}/api/og?heading=${title}&mode=light`;

export const metadata = {
  title,
  description:
    "Record, transcribe, and automatically generate notes using KnowNotes.",
  alternates: {
    canonical: "/lecture",
  },
  openGraph: {
    title,
    description:
      "Record, transcribe, and automatically generate notes using KnowNotes.",
    url: absoluteUrl("/lecture"),
    images: [
      {
        url: ogUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description:
      "Record, transcribe, and automatically generate notes using KnowNotes.",
    images: [ogUrl],
  },
};

interface RecordPageParams {
  params: {};
  searchParams: { courseId?: string };
}

export default async function LecturePage({ searchParams }: RecordPageParams) {
  const { courseId } = searchParams;
  const id = await createLecture(courseId, "LIVE");
  if (id) redirect(`/lecture/${id}`);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="p-8 text-center">
        <div className="animate-pulse text-lg">
          Creating new live lecture environment...
        </div>
      </div>
    </div>
  );
}
