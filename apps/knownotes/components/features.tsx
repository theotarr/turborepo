"use client";

import Image, { StaticImageData } from "next/image";
import CourseChatImage from "@/assets/images/features/course-chat.png";
import ImportLectureImage from "@/assets/images/features/import-lecture.png";
import LiveChatImage from "@/assets/images/features/live-lecture-chat.png";
import LiveLectureImage from "@/assets/images/features/live-lecture.png";
import { cn } from "@/lib/utils";

import Editor from "./editor";
import { Icons } from "./icons";
import { Button, buttonVariants } from "./ui/button";
import { Card } from "./ui/card";

export function PrimaryFeatures() {
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
      <Card className="relative overflow-hidden rounded-xl bg-gradient-to-br from-transparent to-primary/5 px-6 pt-8 shadow-lg">
        <h2 className="text-xl font-semibold tracking-tight text-secondary-foreground lg:text-2xl">
          KnowNotes is your AI tutor, and it&nbsp;&nbsp;
          <span className="relative inline-flex items-baseline gap-2 rounded-full pl-8 pr-2 text-primary">
            <div className="absolute -inset-x-1 inset-y-0 flex items-center rounded-full bg-primary/20 pl-2 text-primary">
              <Icons.audioLines className="size-5" />
            </div>
            <span>transcribes</span>
          </span>
          &nbsp;&nbsp;your lectures
        </h2>
        <div className="mt-8 h-full rounded-t-lg border-x border-t bg-background shadow-sm">
          <Editor
            className="pt-2"
            editable={false}
            autoFocus={false}
            defaultValue={`
philosophy: fundamental questions

metaphysics, epistemology, ethics, logic
`}
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto w-auto rounded-l-full border border-border p-2.5 pr-1.5 shadow-lg",
            )}
          >
            <Icons.audioLines className={cn("size-8 p-1 text-primary")} />
          </button>

          <button
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto w-auto rounded-r-full border border-border p-2.5 pl-1.5 shadow-lg",
            )}
          >
            <Icons.square className="size-8 fill-secondary-foreground p-1 text-secondary-foreground" />
          </button>
        </div>
      </Card>
      <Card className="relative overflow-hidden rounded-xl bg-gradient-to-br from-transparent to-primary/5 px-6 pt-8 shadow-lg">
        <h2 className="text-xl font-semibold tracking-tight text-secondary-foreground lg:text-2xl">
          When your lecture ends, KnowNotes&nbsp;&nbsp;
          <span className="relative inline-flex items-baseline gap-2 rounded-full pl-8 pr-2 text-primary">
            <div className="absolute -inset-x-1 inset-y-0 flex items-center rounded-full bg-primary/20 pl-2 text-primary">
              <Icons.magic className="size-5" />
            </div>
            <span>enhances</span>
          </span>
          &nbsp;&nbsp;your notes and study materials
        </h2>
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
          <Button variant="secondary">
            <Icons.flashcards className="mr-2 size-4" />
            Flashcards
          </Button>
          <Button variant="secondary">
            <Icons.quiz className="mr-2 size-4" />
            Quiz
          </Button>
        </div>
        <div className="mt-8 h-full rounded-t-lg border-x border-t bg-background shadow-sm">
          <Editor
            Render={false}
            className="pb-16 pt-4"
            editable={false}
            autoFocus={false}
            defaultValue={`
- **Definition of Philosophy**: Philosophy is the study of fundamental questions regarding existence, knowledge, values, reason, mind, and language.
- **Branches of Philosophy**:
  - **Metaphysics**: Study of the nature of reality and existence.
  - **Epistemology**: Study of knowledge and belief.
  - **Ethics**: Study of moral values and rules.
  - **Logic**: Study of reasoning and argumentation.`}
          />
        </div>
      </Card>
    </div>
  );
}

export function FeatureGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-12 gap-y-8 md:grid-cols-2",
        className,
      )}
    >
      <ImageFeature
        src={CourseChatImage}
        title="Chat With Your Class"
        description="Get help with your assignments, essays, and studying with our AI personalized for your classes."
      />
      <ImageFeature
        src={ImportLectureImage}
        title="Import Lectures"
        description="Upload your lectures (files, Youtube videos, etc.) and have them automatically transcribed and summarized."
      />
      <TextFeature
        title="Citations From Your Sources"
        description="Get citations and sources from your classes for your essays and assignments."
      />
      <TextFeature
        title="Automatic Note Taking"
        description="Automatically take notes from your lectures and classes."
      />
    </div>
  );
}

function ImageFeature({
  src,
  title,
  description,
}: {
  src: string | StaticImageData;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col space-y-4 pt-4">
      <div className="relative h-[360px] w-full">
        <Image
          src={src}
          alt={title}
          className="rounded-xl shadow-lg"
          fill
          sizes="100vw"
          style={{
            objectFit: "cover",
          }}
        />
      </div>
      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-secondary-foreground/90">
          {title}
        </h3>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TextFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col space-y-2 border-t pt-6">
      <h3 className="text-2xl font-semibold tracking-tight text-secondary-foreground/90">
        {title}
      </h3>
      <p className="text-base text-muted-foreground">{description}</p>
    </div>
  );
}
