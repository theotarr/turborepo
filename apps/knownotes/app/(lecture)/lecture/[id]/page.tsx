import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditableTitle } from "@/components/editable-title";
import { Icons } from "@/components/icons";
import { NotesPage } from "@/components/notes-page";
import { PremiumFeature } from "@/components/premium-feature";
import { ShareLectureDialog } from "@/components/share-lecture-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAccountNav } from "@/components/user-account-nav";
import { env } from "@/env";
import { AI } from "@/lib/chat/actions";
import { supabase } from "@/lib/supabase";
import { absoluteUrl, cn } from "@/lib/utils";

import { auth } from "@acme/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

export default async function LecturePage({ params }: LecturePageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { data: lecture } = await supabase
    .from("Lecture")
    .select("*, course:courseId (*), Message(*), Flashcard(*), Question(*)")
    .eq("userId", session.user.id)
    .eq("id", params.id)
    .single();

  // Convert SQL to Prisma relations format.
  lecture.messages = lecture.Message;
  delete lecture.Message;
  lecture.flashcards = lecture.Flashcard;
  delete lecture.Flashcard;
  lecture.questions = lecture.Question;
  delete lecture.Question;

  if (!lecture) return <>Loading...</>;

  const aiState = {
    chatId: lecture.id,
    messages: lecture.messages.map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as
        | "function"
        | "user"
        | "assistant"
        | "system",
      content: m.content,
    })),
  };

  return (
    <AI initialAIState={aiState}>
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="sticky top-0 z-10">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center space-x-2 overflow-hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/dashboard"
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "p-1",
                      )}
                    >
                      <Icons.chevronLeft className="size-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Back to dashboard
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex flex-col justify-center gap-y-2">
                <EditableTitle
                  lectureId={params.id}
                  initialTitle={lecture.title}
                />
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
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          <PremiumFeature>
            <NotesPage lecture={lecture} />
          </PremiumFeature>
        </main>
      </div>
    </AI>
  );
}
