"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { createLecture } from "@/app/(lecture)/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

import { Icons } from "./icons";
import {
  useFileUploadDialogStore,
  useYoutubeTextDialogStore,
} from "./lecture-create-dialog";

interface QuickActionProps {
  icon: React.ReactNode | keyof typeof Icons;
  title: string;
  description?: string;
  className?: string;
  [key: string]: any;
}
export function QuickAction({
  icon,
  title,
  description,
  className,
  ...props
}: QuickActionProps) {
  // Render the icon based on its type
  let iconElement: React.ReactNode;
  if (typeof icon === "string") {
    const IconComponent = Icons[icon as keyof typeof Icons];
    iconElement = (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
        <IconComponent className="h-5 w-5" />
      </div>
    );
  } else {
    iconElement = icon;
  }

  return (
    <Card
      className={cn(
        "group relative h-full w-full cursor-pointer border-border bg-card transition-all duration-200 hover:bg-gradient-to-br hover:from-card hover:to-primary/10",
        className,
      )}
      {...props}
    >
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex gap-4">
          <div className="shrink-0">{iconElement}</div>
          <div className="flex-1 space-y-1.5">
            <CardTitle className="text-base font-semibold tracking-tight">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm leading-normal text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLectureComponent() {
  const router = useRouter();
  const utils = api.useUtils();
  return (
    <QuickAction
      icon="mic"
      title="Record Lecture"
      description="Record your class in real-time"
      onClick={async () => {
        const id = await createLecture(undefined, "LIVE");
        utils.lecture.list.invalidate();
        router.push(`/lecture/${id}`);
      }}
    />
  );
}

function QuickPasteComponent() {
  const { setOpen, setTab } = useYoutubeTextDialogStore();

  return (
    <QuickAction
      icon="link"
      title="YouTube/Text"
      description="Paste a YouTube URL or text content"
      onClick={() => {
        setOpen(true);
        setTab("youtube");
      }}
    />
  );
}

function QuickUploadComponent() {
  const { setOpen } = useFileUploadDialogStore();

  return (
    <QuickAction
      icon="page"
      title="Upload File"
      description="Upload PDF, DOCX, TXT, or audio file"
      onClick={() => {
        setOpen(true);
      }}
    />
  );
}

// Memoized components
export const QuickLecture = memo(QuickLectureComponent);
export const QuickPaste = memo(QuickPasteComponent);
export const QuickUpload = memo(QuickUploadComponent);

// Array of quick actions with animations
export const QuickActions = memo(function QuickActionsComponent() {
  const quickActions = [
    { Component: QuickLecture },
    { Component: QuickPaste },
    { Component: QuickUpload },
  ];

  return (
    <>
      {quickActions.map(({ Component }, index) => (
        <Component key={index} />
      ))}
    </>
  );
});
