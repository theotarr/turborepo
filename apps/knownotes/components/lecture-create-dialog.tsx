"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createLecture } from "@/app/(lecture)/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";
import { DialogDescription } from "@radix-ui/react-dialog";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { v1 as uuidv1 } from "uuid";
import { create } from "zustand";

import { Icons } from "./icons";
import { Input } from "./ui/input";

export const useLectureCreateDialogStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
  tab: "live" | "file" | "youtube";
  setTab: (tab: "live" | "file" | "youtube") => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  tab: "live",
  setTab: (tab) => set({ tab }),
  selectedCourseId: "",
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
}));

interface LectureCreateDialogProps {
  userId: string;
  courses: Course[];
  className?: string;
  [key: string]: any;
}

export function LectureCreateDialog({
  userId,
  courses,
  className,
}: LectureCreateDialogProps) {
  const router = useRouter();
  const { open, setOpen, tab, setTab, selectedCourseId, setSelectedCourseId } =
    useLectureCreateDialogStore();
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = async () => {
    setIsLoading(true);
    // for live lectures, we just redirect to the lecture page with the courseId
    if (tab === "live") {
      const id = await createLecture(selectedCourseId, "LIVE");
      router.push(`/lecture/${id}`);
      router.refresh();
    } else if (tab === "youtube") {
      // For Youtube videos, we need to create a lecture and then redirect to the lecture page.
      const response = await fetch(`/api/transcribe/youtube`, {
        method: "POST",
        body: JSON.stringify({
          videoUrl,
          courseId: selectedCourseId,
        }),
      });
      const data = await response.json();

      if (response.status !== 200) {
        if (response.status === 404 && data === "No transcript found") {
          toast.error(
            "We're sorry, YouTube is currently blocking us from downloading your video. We're working on a fix!",
          );
        }
        // else if (response.status === 403) {
        //   toast.error("Pro plan required");
        // }
        else {
          toast.error(
            "Failed to download your video. Make sure the video has a transcript.",
          );
        }
        setIsLoading(false);
        return;
      }

      window.location.href = `/lecture/${data.id}`;
    } else if (tab === "file") {
      // check if the user has uploaded a file
      if (!fileRef.current?.files?.length) {
        setIsLoading(false);
        toast.error("Please upload a file.");
        return;
      }
      // Upload the file to the Supabase `audio` bucket
      const file = fileRef.current.files[0];
      const fileId = uuidv1();
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      );

      const { error } = await supabase.storage
        .from("audio")
        .upload(`${userId}/${fileId}`, file);

      if (error) {
        console.error(error);
        setIsLoading(false);
        toast.error("Failed to upload the audio file.");
        return;
      }
      toast.success("Audio file uploaded successfully.");

      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("courseId", selectedCourseId);

      // Send a request to the server to transcribe the audio file.
      const response = await fetch(`/api/transcribe/file`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setIsLoading(false);
        toast.error("Failed to transcribe the audio file. Please try again.");
        return;
      }

      const { id } = await response.json();
      window.location.href = `/lecture/${id}`;
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={
            className
              ? className
              : buttonVariants({ variant: "outline", size: "sm" })
          }
        >
          <Icons.add className="mr-2 h-4 w-4 sm:hidden" />
          <div className="mr-1 hidden sm:inline">New </div> Lecture
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Lecture</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new lecture, or import a Youtube video or a file (pdf, mp3,
            wav, etc.).
          </DialogDescription>
        </DialogHeader>
        <Tabs
          className="grid gap-4 py-4"
          value={tab}
          onValueChange={(val) => setTab(val as any)}
        >
          <div className="grid gap-2">
            <Label>Lecture Type</Label>
            <TabsList className="w-full">
              <TabsTrigger disabled={isLoading} className="w-full" value="live">
                Live
              </TabsTrigger>
              <TabsTrigger
                disabled={isLoading}
                className="w-full"
                value="youtube"
              >
                Youtube Video
              </TabsTrigger>
              <TabsTrigger disabled={isLoading} className="w-full" value="file">
                File
              </TabsTrigger>
            </TabsList>
          </div>
          {/* <TabsContent value="live"></TabsContent> */}
          <TabsContent value="youtube">
            <div className="grid gap-2">
              <Label htmlFor="name">Video URL</Label>
              <Input
                id="videoUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                autoComplete="off"
                autoCorrect="off"
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Paste the URL of a YouTube video. We&apos;ll generate notes, and
                create an AI chat bot for it.{" "}
                <span className="italic">
                  Your video must have a YT-generated transcript.
                </span>
              </p>
            </div>
          </TabsContent>
          <TabsContent value="file">
            <div className="grid gap-2">
              <Label htmlFor="audioFile">File</Label>
              <Input
                id="file"
                type="file"
                ref={fileRef}
                accept="audio/*,application/pdf"
              />
              <p className="text-sm text-muted-foreground">
                Upload a file in PDF or any audio format. We&apos;ll generate
                notes and create an AI tutor for it.
              </p>
            </div>
          </TabsContent>
          <div>
            <div className="grid gap-2">
              <Label htmlFor="course">Course</Label>
              <Popover
                open={coursePopoverOpen}
                onOpenChange={setCoursePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between"
                    disabled={isLoading}
                  >
                    {selectedCourseId
                      ? courses.find((c) => c.id === selectedCourseId)?.name
                      : "Select course..."}
                    <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="mr-[80px] w-[360px] p-0">
                  <Command>
                    <CommandInput
                      name="course"
                      disabled={isLoading}
                      placeholder="Search your courses..."
                    />
                    <CommandGroup>
                      {courses.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.id}
                          onSelect={(currentSelectedCourse) => {
                            setSelectedCourseId(
                              currentSelectedCourse === selectedCourseId
                                ? ""
                                : currentSelectedCourse,
                            );
                            setCoursePopoverOpen(false);
                          }}
                        >
                          <Icons.check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCourseId === c.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Tabs>
        <DialogFooter>
          <Button onClick={() => onSubmit()} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
