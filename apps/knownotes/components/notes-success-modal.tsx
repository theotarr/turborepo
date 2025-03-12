"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { absoluteUrl } from "@/lib/utils";

interface NotesSuccessModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  lectureId: string;
  title?: string;
}

export function NotesSuccessModal({
  open,
  onOpenChange,
  lectureId,
  title = "Untitled lecture",
}: NotesSuccessModalProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const shareUrl = absoluteUrl(`/share/lecture/${lectureId}`);

  const handleCopy = () => {
    copyToClipboard(shareUrl);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Notes: ${title}`,
          text: "Check out my KnowNotes lecture notes!",
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notes Generated Successfully!</DialogTitle>
          <DialogDescription>
            Your formatted notes are ready. Study using flashcards, quizzes, and
            ask any questions.
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

          <div className="text-center text-xs text-muted-foreground">
            Anyone with the link can view these notes
          </div>
        </div>

        <DialogFooter className="flex-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange && onOpenChange(false)}
          >
            Continue Studying
          </Button>
          <Button onClick={handleShare} size="sm">
            <Icons.share className="mr-2 size-4" />
            Share Notes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
