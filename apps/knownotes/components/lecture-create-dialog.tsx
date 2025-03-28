"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import * as Tus from "tus-js-client";
import { v1 as uuidv1 } from "uuid";
import { create } from "zustand";

import { Icons } from "./icons";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";

// Upload File Dialog Store
export const useFileUploadDialogStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  selectedCourseId: "",
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
}));

// YouTube/Text Dialog Store
export const useYoutubeTextDialogStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
  tab: "youtube" | "text";
  setTab: (tab: "youtube" | "text") => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  tab: "youtube",
  setTab: (tab) => set({ tab }),
  selectedCourseId: "",
  setSelectedCourseId: (id) => set({ selectedCourseId: id }),
}));

interface LectureCreateActionsProps {
  userId: string;
  courses: Course[];
}

export function LectureCreateActions({
  userId,
  courses,
}: LectureCreateActionsProps) {
  return (
    <>
      <FileUploadDialog userId={userId} courses={courses} />
      <YoutubeTextDialog courses={courses} />
    </>
  );
}

// File Upload Dialog
function FileUploadDialog({
  userId,
  courses,
}: {
  userId: string;
  courses: Course[];
}) {
  const { open, setOpen, selectedCourseId, setSelectedCourseId } =
    useFileUploadDialogStore();
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadRef = useRef<Tus.Upload | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

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
        }
      }
    },
    [open, setOpen],
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
    setUploadProgress(0);

    // check if the user has uploaded a file
    if (!fileRef.current?.files?.length) {
      setIsLoading(false);
      toast.error("Please upload a file.");
      return;
    }

    // Prepare the file for upload
    const file = fileRef.current.files[0];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const fileId = `${uuidv1()}.${fileExt}`;
    const path = `${userId}/${fileId}`;

    try {
      // Configure the TUS upload
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const supabaseAnonKey = process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

      const upload = new Tus.Upload(file, {
        endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${supabaseAnonKey}`,
          "x-upsert": "true", // Overwrite files with the same name
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // Important to allow re-uploading the same file
        metadata: {
          bucketName: "audio",
          objectName: path,
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
        },
        chunkSize: 6 * 1024 * 1024, // Must be set to 6MB for Supabase
        onError: (error) => {
          console.error("Upload failed:", error);
          toast.error(`Upload failed: ${error.message || "Unknown error"}`);
          setIsLoading(false);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal) * 100;
          setUploadProgress(percentage);
        },
        onSuccess: async () => {
          setUploadProgress(100);
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
            toast.error("Failed to process the file. Please try again.");
          }
        },
      });

      // Store the upload instance to potentially cancel it later
      uploadRef.current = upload;

      // Check for previous uploads to resume
      upload.findPreviousUploads().then((previousUploads) => {
        // Found previous uploads so we select the first one
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        // Start the upload
        upload.start();
      });
    } catch (error) {
      console.error("Error setting up upload:", error);
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  // Function to cancel ongoing upload
  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
      setUploadProgress(0);
      setIsLoading(false);
      toast.info("Upload cancelled");
    }
  };

  // Reset upload state when dialog closes
  useEffect(() => {
    if (!open) {
      if (uploadRef.current) {
        cancelUpload();
      }
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && isLoading && uploadProgress < 100) {
          // Ask for confirmation before closing
          if (window.confirm("Cancel the upload?")) {
            cancelUpload();
            setOpen(false);
          }
          return;
        }
        setOpen(newOpen);
      }}
    >
      <DialogContent
        className={cn(
          "sm:max-w-lg",
          isDragging && "border-2 border-dashed border-primary",
        )}
      >
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload a file to create a lecture.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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
              accept="audio/*,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Upload a PDF, DOCX, TXT, or audio file to create notes.
            </p>
            {isDragging && (
              <div className="mt-2 flex flex-col items-center justify-center gap-4 rounded-md border border-2 border-dashed border-primary bg-muted/20 p-4 text-center text-sm text-primary">
                <UploadCloud className="size-10" />
                Drop your file here to upload
              </div>
            )}

            {isLoading && uploadProgress > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading... {Math.round(uploadProgress)}%</span>
                  {uploadProgress < 100 && (
                    <button
                      onClick={cancelUpload}
                      className="text-destructive hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <Progress value={uploadProgress} max={100} />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="course">Course (Optional)</Label>
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

        <DialogFooter>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading && uploadProgress === 0 && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {uploadProgress === 100 ? "Processing..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// YouTube/Text Dialog
function YoutubeTextDialog({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const { open, setOpen, tab, setTab, selectedCourseId, setSelectedCourseId } =
    useYoutubeTextDialogStore();
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const uploadYoutube = api.lecture.uploadYoutube.useMutation();
  const uploadText = api.lecture.uploadText.useMutation();

  const onSubmit = async () => {
    setIsLoading(true);

    if (tab === "youtube") {
      try {
        if (!videoUrl.trim()) {
          setIsLoading(false);
          toast.error("Please enter a video URL.");
          return;
        }

        const lecture = await uploadYoutube.mutateAsync({
          videoUrl,
          courseId: selectedCourseId,
        });
        window.location.href = `/lecture/${lecture.id}`;
        router.refresh();
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        toast.error("Failed to upload the video. Please try again.");
        return;
      }
    } else if (tab === "text") {
      try {
        if (!pastedText.trim()) {
          setIsLoading(false);
          toast.error("Please enter some text.");
          return;
        }

        const lecture = await uploadText.mutateAsync({
          text: pastedText,
          courseId: selectedCourseId,
        });
        window.location.href = `/lecture/${lecture.id}`;
        router.refresh();
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        toast.error("Failed to process the text. Please try again.");
        return;
      }
    }

    setIsLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Paste a YouTube video URL or enter text content.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          className="grid gap-4 py-4"
          value={tab}
          onValueChange={(val) => setTab(val as any)}
        >
          <div className="grid gap-2">
            <Label>Content Type</Label>
            <TabsList className="w-full">
              <TabsTrigger
                disabled={isLoading}
                className="w-full"
                value="youtube"
              >
                YouTube
              </TabsTrigger>
              <TabsTrigger disabled={isLoading} className="w-full" value="text">
                Text
              </TabsTrigger>
            </TabsList>
          </div>

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

          <TabsContent value="text">
            <div className="grid gap-2">
              <Label htmlFor="pastedText">Text Content</Label>
              <Textarea
                id="pastedText"
                placeholder="Paste your lecture content here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="min-h-[160px]"
              />
              <p className="text-sm text-muted-foreground">
                Type or paste text directly to generate notes from it.
              </p>
            </div>
          </TabsContent>

          <div className="grid gap-2">
            <Label htmlFor="course">Course (Optional)</Label>
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
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onSubmit()} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {tab === "youtube" ? "Upload" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
