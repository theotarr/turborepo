"use client";

import type { Attachment, UIMessage } from "ai";
import type React from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowUp, Paperclip, Square } from "lucide-react";
import { toast } from "sonner";
import * as Tus from "tus-js-client";
import { v1 as uuidv1 } from "uuid";

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
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const uploadRefs = useRef<Record<string, any>>({});

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
          "max-h-[calc(75dvh)] min-h-[24px] resize-none overflow-hidden rounded-2xl border bg-muted pb-10 !text-base",
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

            if (status !== "ready") {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }
        }}
      />

      <div className="absolute bottom-0 flex w-fit flex-row justify-start p-2">
        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
      </div>

      <div className="absolute bottom-0 right-0 flex w-fit flex-row justify-end p-2">
        {status === "submitted" ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
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
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="h-fit rounded-full border p-1.5"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUp size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
