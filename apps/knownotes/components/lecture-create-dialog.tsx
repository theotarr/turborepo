"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";
import { DialogDescription } from "@radix-ui/react-dialog";
import { createBrowserClient } from "@supabase/ssr";
import { UploadCloud } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const uploadYoutube = api.lecture.uploadYoutube.useMutation();
  const uploadFile = api.lecture.uploadFile.useMutation();

  // Native drag and drop handlers
  const handleDragIn = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;

      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
        if (!open) {
          setOpen(true);
          setTab("file");
        }
      }
    },
    [open, setOpen, setTab],
  );

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;

    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  }, []);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (
      e.dataTransfer?.files &&
      e.dataTransfer.files.length > 0 &&
      fileRef.current
    ) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(e.dataTransfer.files[0]);
      fileRef.current.files = dataTransfer.files;
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener("dragenter", handleDragIn);
    window.addEventListener("dragleave", handleDragOut);
    window.addEventListener("dragover", handleDrag);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragIn);
      window.removeEventListener("dragleave", handleDragOut);
      window.removeEventListener("dragover", handleDrag);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragIn, handleDragOut, handleDrag, handleDrop]);

  // Reset dragging state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  }, [open]);

  const onSubmit = async () => {
    setIsLoading(true);
    // for live lectures, we just redirect to the lecture page with the courseId
    if (tab === "live") {
      const id = await createLecture(selectedCourseId, "LIVE");
      router.push(`/lecture/${id}`);
      router.refresh();
    } else if (tab === "youtube") {
      try {
        const lecture = await uploadYoutube.mutateAsync({
          videoUrl,
        });
        window.location.href = `/lecture/${lecture.id}`;
        router.refresh();
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        toast.error("Failed to upload the video. Please try again.");
        return;
      }
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
        toast.error("Failed to upload the file.");
        return;
      }
      toast.success("File uploaded successfully.");

      try {
        const lecture = await uploadFile.mutateAsync({
          fileId,
          courseId: selectedCourseId,
        });
        setIsDragging(false);
        window.location.href = `/lecture/${lecture.id}`;
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        toast.error("Failed to parse the file. Please try again.");
        return;
      }
    }
    setIsLoading(false);
    setIsDragging(false);
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
      <DialogContent
        className={cn(
          "sm:max-w-lg",
          isDragging && "border-2 border-dashed border-primary",
        )}
      >
        <DialogHeader>
          <DialogTitle>New Lecture</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload a file, paste a Youtube video, or record a lecture.
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
                Paste the link of a YouTube video. Your video must have a
                transcript.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="file">
            <div
              className={cn(
                "grid gap-2",
                isDragging && "rounded-md bg-muted/20 p-4",
              )}
            >
              <Label htmlFor="audioFile">File</Label>
              <Input
                id="file"
                type="file"
                ref={fileRef}
                accept="audio/*,application/pdf"
              />
              <p className="text-sm text-muted-foreground">
                Upload a PDF or audio file.
              </p>
              {isDragging && (
                <div className="mt-2 flex flex-col items-center justify-center gap-4 rounded-md border border-2 border-dashed border-primary bg-muted/20 p-4 text-center text-sm text-primary">
                  <UploadCloud className="size-10" />
                  Drop your file here to upload
                </div>
              )}
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
