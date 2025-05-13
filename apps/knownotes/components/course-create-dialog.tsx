"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/app/(auth)/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Icons } from "./icons";
import { Input } from "./ui/input";

interface CourseCreateDialogProps {
  className?: string;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onCourseCreated?: (newCourse: { id: string; name: string }) => void;
  [key: string]: any;
}

export function CourseCreateDialog({
  open,
  onOpenChange,
  onCourseCreated,
  className,
}: CourseCreateDialogProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const courseName = name;
    const { id } = await createCourse(courseName);
    setIsLoading(false);

    if (!id) return toast.error("Something went wrong. Please try again.");

    toast.success("Success!");
    utils.course.invalidate();
    router.refresh();

    if (onCourseCreated) {
      onCourseCreated({ id, name: courseName });
    }

    if (onOpenChange && open) {
      onOpenChange(false);
    }
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open === undefined && (
        <DialogTrigger asChild>
          <button
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              className,
            )}
          >
            {className?.includes("w-7") ? (
              <Icons.add className="size-4" />
            ) : (
              <>
                <Icons.add className="mr-2 h-4 w-4" />
                <span>New Course</span>
              </>
            )}
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Course</DialogTitle>
          <DialogDescription>
            Create a new course to organize your notes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={async (e) => onSubmit(e)}
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
