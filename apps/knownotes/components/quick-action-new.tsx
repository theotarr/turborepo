"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { Icons } from "./icons";
import { useLectureCreateDialogStore } from "./lecture-create-dialog";

interface QuickActionProps {
  icon: keyof typeof Icons;
  title: string;
  description?: string;
  primary?: boolean;
  className?: string;
  [key: string]: any;
}
export function QuickAction({
  icon,
  title,
  description,
  primary = false,
  className,
  ...props
}: QuickActionProps) {
  const Icon = Icons[icon];
  return (
    <Card
      className={cn(
        "group max-w-[400px] cursor-pointer pt-4 transition-all hover:bg-secondary/40 md:max-w-full",
        className,
      )}
      {...props}
    >
      <CardContent>
        <div className="flex justify-between space-x-4">
          <Icon className="size-10 shrink-0 rounded-full bg-primary/10 p-2 text-primary transition-all" />
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickChat() {
  const router = useRouter();
  return (
    <QuickAction
      icon="messageSquareText"
      title="Chat With Course"
      description="AI tutor trained on all your course lectures"
      onClick={() => router.push("/chat")}
    />
  );
}

export function QuickLecture() {
  const { setOpen, setTab } = useLectureCreateDialogStore();
  return (
    <QuickAction
      icon="add"
      title="Live Lecture"
      description="Record a lecture in real-time"
      primary={true}
      onClick={() => {
        setOpen(true);
        setTab("live");
      }}
    />
  );
}

export function QuickYoutubeImport() {
  const { setOpen, setTab } = useLectureCreateDialogStore();
  return (
    <QuickAction
      icon="youtube"
      title="Upload Lecture"
      description="Paste a Youtube video for notes"
      primary={true}
      onClick={() => {
        setOpen(true);
        setTab("youtube");
      }}
    />
  );
}

export function QuickAudioUpload() {
  const { setOpen, setTab } = useLectureCreateDialogStore();
  return (
    <QuickAction
      icon="audioFile"
      title="Upload Lecture"
      description="Upload a file for notes and AI-tutor."
      primary={true}
      onClick={() => {
        setOpen(true);
        setTab("file");
      }}
    />
  );
}

export function QuickAffiliate() {
  return (
    <QuickAction
      icon="dollarSign"
      title="Get Paid"
      description="Refer your friends to KnowNotes."
      primary={true}
      onClick={() => window.open("https://affiliates.knownotes.ai/", "_blank")}
    />
  );
}
