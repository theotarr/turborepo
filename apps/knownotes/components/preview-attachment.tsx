import type { Attachment } from "ai";
import { X } from "lucide-react";

import { Icons } from "./icons";
import { Progress } from "./ui/progress";

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  progress = 0,
  onRemove,
  onCancel,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  progress?: number;
  onRemove?: () => void;
  onCancel?: () => void;
}) => {
  const { name, url, contentType } = attachment;

  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div className="relative flex aspect-video h-16 w-20 flex-col items-center justify-center rounded-md bg-muted">
        {contentType ? (
          contentType.startsWith("image") ? (
            // NOTE: it is recommended to use next/image for images
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={name ?? "An image attachment"}
              className="size-full rounded-md object-cover"
            />
          ) : contentType.startsWith("video") ? (
            <Icons.video className="h-8 w-8 text-muted-foreground" />
          ) : contentType.startsWith("audio") ? (
            <Icons.audio className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Icons.file className="h-8 w-8 text-muted-foreground" />
          )
        ) : (
          <Icons.file className="h-8 w-8 text-muted-foreground" />
        )}

        {/* Show spinner for uploads with no progress info */}
        {isUploading && progress === 0 && (
          <Icons.spinner
            data-testid="input-attachment-loader"
            className="absolute h-4 w-4 animate-spin text-muted-foreground"
          />
        )}

        {/* Show remove button for completed attachments */}
        {!isUploading && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground text-background hover:bg-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Show cancel button for in-progress uploads */}
        {isUploading && onCancel && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground text-background hover:bg-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Display file name */}
      <div className="max-w-16 truncate text-xs text-muted-foreground">
        {name}
      </div>

      {/* Show progress bar for uploads with progress info */}
      {isUploading && progress > 0 && (
        <div className="w-20">
          <Progress value={progress} max={100} className="h-1" />
          <div className="mt-1 text-center text-xs text-muted-foreground">
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
};
