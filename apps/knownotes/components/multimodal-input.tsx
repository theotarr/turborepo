"use client";

import type { Attachment, UIMessage } from "ai";
import type React from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowUp, ChevronDown, Paperclip, Plus, Square } from "lucide-react";
import { toast } from "sonner";
import * as Tus from "tus-js-client";
import { v1 as uuidv1 } from "uuid";

import { CourseCreateDialog } from "./course-create-dialog";
import { PreviewAttachment } from "./preview-attachment";
import { SuggestedActions } from "./suggested-actions";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

function PureMultimodalInput({
  userId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  showSuggestedActions,
  courses,
  onCourseSelect,
  selectedCourseIdProp,
  isCourseSelectionRequired,
  lectureId,
}: {
  userId: string;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  status: UseChatHelpers["status"];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers["setMessages"];
  append: UseChatHelpers["append"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  className?: string;
  showSuggestedActions?: boolean;
  courses?: {
    id: string;
    name: string;
  }[];
  onCourseSelect?: (courseId: string | null) => void;
  selectedCourseIdProp?: string;
  isCourseSelectionRequired?: boolean;
  lectureId?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const uploadRefs = useRef<Record<string, any>>({});
  const [currentSelectedCourseId, setCurrentSelectedCourseId] = useState<
    string | null
  >(selectedCourseIdProp ?? null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] =
    useState(false);

  // Update local state if prop changes
  useEffect(() => {
    setCurrentSelectedCourseId(selectedCourseIdProp ?? null);
  }, [selectedCourseIdProp]);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitForm = useCallback(() => {
    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    resetHeight();

    textareaRef.current?.focus();
  }, [attachments, handleSubmit, setAttachments]);

  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;

    try {
      // Create an entry in the progress state
      setUploadProgress((prev) => ({
        ...prev,
        [fileId]: 0,
      }));

      // Get required configuration
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const supabaseAnonKey = process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

      // Generate a unique path
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      const fileId2 = `${uuidv1()}.${fileExt}`;
      const path = `${userId}/${fileId2}`;

      console.log("Direct Tus upload - details:");
      console.log("- File:", file.name);
      console.log("- Size:", file.size, "bytes");
      console.log("- Path:", path);
      console.log("- Endpoint:", endpoint);
      console.log("- Bucket:", "audio");

      // Create direct Tus upload
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
          bucketName: "audio", // Use audio bucket since it works in other components
          objectName: path,
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
        },
        chunkSize: 6 * 1024 * 1024, // Must be set to 6MB for Supabase
        onBeforeRequest: (req) => {
          // Log the full request details for debugging
          console.log("TUS Request details:");
          console.log("- Method:", req.getMethod());
          console.log("- URL:", req.getURL());
          // Headers are not easily accessible, skipping
        },
        onAfterResponse: (req, res) => {
          // Log the full response details for debugging
          console.log("TUS Response details:");
          console.log("- Status:", res.getStatus());
          console.log("- Body:", res.getBody());
          // Headers are not easily accessible, skipping
        },
        onError: (error) => {
          console.error("Upload failed:", error);
          const tusError = error as any;
          console.error(
            "Response details:",
            tusError.originalResponse?.getBody
              ? tusError.originalResponse.getBody()
              : "No response body",
            tusError.originalResponse?.getStatus?.() || "No status",
          );

          toast.error(`Failed to upload ${file.name}: ${error.message}`);

          // Remove from progress tracking
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });

          // Remove the upload reference
          delete uploadRefs.current[fileId];
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = (bytesUploaded / bytesTotal) * 100;
          // Update progress
          setUploadProgress((prev) => ({
            ...prev,
            [fileId]: percentage,
          }));
        },
        onSuccess: () => {
          // Construct the file URL
          const fileUrl = `${supabaseUrl}/storage/v1/object/public/audio/${path}`;

          // On success, add the file to attachments
          const newAttachment = {
            url: fileUrl,
            name: file.name,
            contentType: file.type,
          };

          setAttachments((prev) => [...prev, newAttachment]);

          // Remove from progress tracking
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });

          // Remove the upload reference
          delete uploadRefs.current[fileId];
        },
      });

      // Check for previous uploads to resume
      await upload.findPreviousUploads().then((previousUploads) => {
        // Found previous uploads so we select the first one
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
      });

      // Start the upload
      upload.start();

      // Store the upload reference for potential cancellation
      uploadRefs.current[fileId] = upload;

      return true;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload ${file.name}. Please try again!`);

      // Remove from progress tracking
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });

      return false;
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      if (files.length === 0) return;

      // Add files to upload queue
      setUploadQueue(files.map((file) => file.name));

      // Upload each file
      for (const file of files) {
        await uploadFile(file);
      }

      // Clear the upload queue when done
      setUploadQueue([]);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [setAttachments],
  );

  const courseSelectionPending =
    isCourseSelectionRequired === true && !currentSelectedCourseId;

  const sendButtonDisabled =
    (input.trim().length === 0 && attachments.length === 0) ||
    uploadQueue.length > 0 ||
    courseSelectionPending;

  const showCourseSelector = !lectureId && courses && courses.length > 0;
  const effectiveComboboxDisabled = messages.length > 0;

  return (
    <div className="relative flex w-full flex-col gap-4">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 &&
        showSuggestedActions && <SuggestedActions append={append} />}

      <input
        type="file"
        className="pointer-events-none fixed -left-4 -top-4 size-0.5 opacity-0"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || Object.keys(uploadProgress).length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row items-end gap-2 overflow-x-scroll"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment
              key={attachment.url}
              attachment={attachment}
              onRemove={() => {
                setAttachments(
                  attachments.filter((a) => a.url !== attachment.url),
                );
              }}
            />
          ))}

          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <PreviewAttachment
              key={fileId}
              attachment={{
                url: "",
                name: fileId.split("-")[0],
                contentType: "",
              }}
              isUploading={true}
              progress={progress}
              onCancel={() => {
                if (uploadRefs.current[fileId]) {
                  uploadRefs.current[fileId].abort();
                  delete uploadRefs.current[fileId];
                }

                setUploadProgress((prev) => {
                  const newProgress = { ...prev };
                  delete newProgress[fileId];
                  return newProgress;
                });
              }}
            />
          ))}
        </div>
      )}

      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder="Ask anything..."
        value={input}
        onChange={handleInput}
        className={cn(
          "max-h-[calc(75dvh)] min-h-[24px] resize-none overflow-hidden rounded-xl border bg-muted pb-10 !text-base",
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();

            // Use the same comprehensive check as the SendButton
            if (sendButtonDisabled) {
              toast.error(
                courseSelectionPending
                  ? "Please select a course first."
                  : "Cannot send message right now.", // Generic for other disabled cases
              );
            } else if (status !== "ready") {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }
        }}
      />

      <div className="absolute bottom-0 left-0 flex w-fit flex-row items-center space-x-2 p-2">
        {showCourseSelector && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                role="combobox"
                aria-expanded={popoverOpen}
                className={cn(
                  "h-fit w-auto min-w-[150px] max-w-[200px] justify-between truncate rounded-md bg-background p-[7px] text-xs",
                  effectiveComboboxDisabled && "cursor-not-allowed opacity-80",
                )}
                // disabled={effectiveComboboxDisabled}
              >
                {currentSelectedCourseId
                  ? courses.find(
                      (course) => course.id === currentSelectedCourseId,
                    )?.name
                  : "No course selected"}
                <ChevronDown className="ml-1.5 shrink-0 opacity-50 last:size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No course found.</CommandEmpty>
                  <CommandGroup>
                    {courses.map((course) => (
                      <CommandItem
                        key={course.id}
                        value={course.id}
                        onSelect={(currentId) => {
                          const newSelectedId =
                            currentId === currentSelectedCourseId
                              ? null
                              : currentId;
                          setCurrentSelectedCourseId(newSelectedId);
                          if (onCourseSelect) {
                            onCourseSelect(newSelectedId);
                          }
                          setPopoverOpen(false);
                        }}
                      >
                        {course.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup className="border-t pt-1">
                    <CommandItem
                      onSelect={() => {
                        setPopoverOpen(false);
                        setIsCreateCourseDialogOpen(true);
                      }}
                      className="text-xs"
                    >
                      <Plus className="mr-2 size-4" />
                      New Course
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <CourseCreateDialog
        open={isCreateCourseDialogOpen}
        onOpenChange={setIsCreateCourseDialogOpen}
        onCourseCreated={(newCourse) => {
          // Dialog is already set to close by onOpenChange in CourseCreateDialog itself
          // or will be by setIsCreateCourseDialogOpen(false) if not already.
          setIsCreateCourseDialogOpen(false);

          setCurrentSelectedCourseId(newCourse.id);
          if (onCourseSelect) {
            onCourseSelect(newCourse.id);
          }
          // The router.refresh() in CourseCreateDialog will handle updating the courses list in the popover
          // after navigation triggered by onCourseSelect.
        }}
      />

      <div className="absolute bottom-0 right-0 flex w-fit flex-row items-center space-x-2 p-2">
        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
        {status === "submitted" ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton submitForm={submitForm} disabled={sendButtonDisabled} />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.courses !== nextProps.courses) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers["status"];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="h-fit rounded-md rounded-bl-lg p-[7px]"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== "ready"}
      variant="ghost"
    >
      <Paperclip size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers["setMessages"];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="h-fit rounded-full border p-1.5"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <Square size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  disabled,
}: {
  submitForm: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      data-testid="send-button"
      className="h-fit rounded-full border p-1.5"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={disabled}
    >
      <ArrowUp size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.disabled !== nextProps.disabled) return false;
  // submitForm is a function, typically stable, but if it changes, re-render.
  if (prevProps.submitForm !== nextProps.submitForm) return false;
  return true;
});
