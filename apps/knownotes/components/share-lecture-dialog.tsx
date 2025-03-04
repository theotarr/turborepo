"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { absoluteUrl, cn } from "@/lib/utils";

interface ShareLectureDialogProps {
  lectureId: string;
  className?: string;
}

export function ShareLectureDialog({
  lectureId,
  className,
}: ShareLectureDialogProps) {
  const [open, setOpen] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const shareUrl = absoluteUrl(`/share/lecture/${lectureId}`);

  const handleCopy = () => {
    copyToClipboard(shareUrl);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
        >
          <Icons.share className="h-4 w-4" />
          <span className="sr-only">Share lecture</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share lecture</DialogTitle>
          <DialogDescription>
            Share this lecture with others by copying the link below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Input readOnly value={shareUrl} className="h-9 w-full" />
          </div>
          <Button onClick={handleCopy} size="sm">
            {isCopied ? (
              <>
                <Icons.check className="mr-2 size-4" />
                Copied
              </>
            ) : (
              <>
                <Icons.link className="mr-2 size-4" />
                Copy
              </>
            )}
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
          <div className="text-sm text-muted-foreground">
            Anyone with the link can view this lecture.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
