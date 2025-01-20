"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { Icons } from "./icons";
import { useLectureCreateDialogStore } from "./lecture-create-dialog";

interface QuickActionProps {
  icon: keyof typeof Icons;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export function QuickAction({
  icon,
  title,
  description,
  children,
  footer,
  className,
  ...props
}: QuickActionProps) {
  const Icon = Icons[icon];
  return (
    <Card
      className={cn(
        "group max-w-[400px] cursor-pointer pt-4 transition-all hover:bg-secondary/20 md:max-w-full",
        className,
      )}
      {...props}
    >
      <CardContent>
        <div className="flex justify-between space-x-4">
          <Icon className="h-10 w-10 shrink-0 rounded-full bg-secondary p-1 text-muted-foreground transition-all group-hover:text-primary" />
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
            {children}
          </div>
        </div>
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

export function QuickYoutubeImport() {
  const { setOpen, setTab } = useLectureCreateDialogStore();
  return (
    <QuickAction
      icon="youtube"
      title="Import Youtube Video"
      description="Upload a Youtube video for the transcript, notes, and a custom AI-tutor for that video."
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
      title="Upload Your Lecture"
      description="Upload an audio file to get transcribed, notes, and a custom AI-tutor for that video."
      onClick={() => {
        setOpen(true);
        setTab("file");
      }}
    />
  );
}
