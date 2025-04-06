"use client";

import { HTMLAttributes, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatOperationsProps extends HTMLAttributes<HTMLDivElement> {
  chat: {
    id: string;
    name: string;
    courseId: string;
  };
  triggerClassName?: string;
}

export function ChatOperations({ chat, className }: ChatOperationsProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isRenameLoading, setIsRenameLoading] = useState(false);
  const [chatName, setChatName] = useState<string>(chat.name);

  // Rename chat mutation
  const renameChat = api.chat.update.useMutation({
    onSuccess: async () => {
      setIsRenameLoading(false);
      setIsRenameDialogOpen(false);
      router.refresh();
      await utils.chat.invalidate();
    },
    onError: (error) => {
      setIsRenameLoading(false);
      setIsRenameDialogOpen(false);
      toast.error("Failed to rename chat");
      console.error("Error renaming chat:", error);
    },
  });

  // Delete chat mutation
  const deleteChat = api.chat.delete.useMutation({
    onSuccess: async () => {
      setIsDeleteLoading(false);
      setIsDeleteAlertOpen(false);

      // If we're on the chat page for the deleted chat, redirect
      if (
        window.location.pathname.includes(`/chat/${chat.courseId}/${chat.id}`)
      ) {
        router.push("/chat");
      } else {
        // Otherwise just refresh the current page
        router.refresh();
      }

      await utils.chat.list.invalidate();
      toast.success("Chat deleted");
    },
    onError: (error) => {
      setIsDeleteLoading(false);
      setIsDeleteAlertOpen(false);
      toast.error("Failed to delete chat");
      console.error("Error deleting chat:", error);
    },
  });

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className={cn(
            "flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-muted",
            className,
          )}
        >
          <Icons.ellipsis className="h-4 w-4" />
          <span className="sr-only">Open</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="flex w-full cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setIsRenameDialogOpen(true);
              setChatName(chat.name);
            }}
          >
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsDeleteAlertOpen(true);
            }}
            className="flex w-full cursor-pointer items-center text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Change the name of this chat. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                className="col-span-3"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              onClick={async (event) => {
                event.preventDefault();
                if (!chatName.trim()) {
                  toast.error("Chat name cannot be empty");
                  return;
                }
                setIsRenameLoading(true);
                renameChat.mutate({
                  id: chat.id,
                  name: chatName,
                });
              }}
              disabled={isRenameLoading}
            >
              {isRenameLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat and remove all associated
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                setIsDeleteLoading(true);
                deleteChat.mutate({ id: chat.id });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleteLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.trash className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
