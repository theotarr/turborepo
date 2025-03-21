import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icons } from "@/components/icons";
import { QuizPage } from "@/components/quiz-page";
import { ShareLectureDialog } from "@/components/share-lecture-dialog";
import { buttonVariants } from "@/components/ui/button";
import { UserAccountNav } from "@/components/user-account-nav";
import { env } from "@/env";
import { supabase } from "@/lib/supabase";
import { absoluteUrl, cn } from "@/lib/utils";

import { auth } from "@acme/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface LecturePageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: LecturePageProps): Promise<Metadata> {
  const { data: lecture } = await supabase
    .from("Lecture")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!lecture) return {};

  const ogUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/api/og`);
  ogUrl.searchParams.set("heading", lecture.title);
  ogUrl.searchParams.set("type", "Course");
  ogUrl.searchParams.set("mode", "light");

  const title = `Quiz on ${lecture.title}`;
  const description = "Take the quiz on this lecture.";

  return {
    title,
    description,
    openGraph: {
      title: lecture.title,
      description,
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
      title,
      description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function LecturePage({ params }: LecturePageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { data: lecture } = await supabase
    .from("Lecture")
    .select("*, course:courseId (*), Question(*)")
    .eq("userId", session.user.id)
    .eq("id", params.id)
    .single();
  if (!lecture) return redirect("/404"); // Lecture not found

  // Convert lecture.Question to lecture.questions
  lecture.questions = lecture.Question;
  delete lecture.Question;

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="sticky top-0 z-10 border-b">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center space-x-6 overflow-hidden">
              <Link
                href={`/lecture/${lecture.id}`}
                className={cn(buttonVariants({ variant: "ghost" }), "p-1")}
              >
                <Icons.chevronLeft className="size-4" />
              </Link>
              <div className="flex items-center space-x-2">
                <Icons.logo className="size-6" />
                <span className="text-lg font-bold tracking-tight">
                  KnowNotes
                </span>
              </div>
            </div>
            <div className="flex flex-1 items-center sm:justify-end">
              <div className="ml-4 flex flex-1 justify-end space-x-4 sm:grow-0">
                <ShareLectureDialog lectureId={params.id} />
                <UserAccountNav
                  user={{
                    name: session.user.name,
                    image: session.user.image,
                    email: session.user.email,
                  }}
                />
              </div>
            </div>
          </div>
        </header>
        <main className="flex w-full flex-1 flex-col overflow-y-scroll">
          <QuizPage lecture={lecture} />
        </main>
      </div>
    </>
  );
}
