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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { deleteLecture } from "@/lib/lecture/actions";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Transcript } from "@/types";
import { toast } from "sonner";

async function updateLecture({
  lectureId,
  title,
  courseId,
}: {
  lectureId: string;
  title: string;
  courseId?: string;
}) {
  const response = await fetch(`/api/lecture/${lectureId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      courseId,
    }),
  });

  if (!response?.ok) {
    toast.error(
      "Something went wrong. Your lecture was not deleted. Please try again.",
    );
    return false;
  }

  return true;
}

interface LectureOperationsProps extends HTMLAttributes<HTMLDivElement> {
  lecture: {
    id: string;
    title: string;
    courseId?: string;
    transcript: Transcript[];
  };
  courses?: {
    id: string;
    name: string;
  }[];
}

export function LectureOperations({
  lecture,
  courses,
  className,
}: LectureOperationsProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);

  const [isCourseComboOpen, setIsCourseComboOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | undefined>(
    lecture.courseId ?? undefined,
  );

  const [lectureName, setLectureName] = useState<string>(lecture.title);

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
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem
                className="flex w-full"
                onSelect={(e) => e.preventDefault()}
              >
                Edit
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Update lecture</DialogTitle>
                <DialogDescription>
                  Make changes to this lecture here. Click save when you&apos;re
                  done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={lectureName}
                    onChange={(e) => setLectureName(e.target.value)}
                    className="col-span-3"
                    autoComplete="off"
                  />
                </div>
                {courses && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Course
                    </Label>
                    <Popover
                      open={isCourseComboOpen}
                      onOpenChange={setIsCourseComboOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-[280px] justify-between"
                        >
                          {courseId
                            ? courses.find((c) => c.id === courseId)?.name
                            : "Select course..."}
                          <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="mr-[80px] w-[360px] p-0">
                        <Command>
                          <CommandInput placeholder="Search your courses..." />
                          <CommandEmpty>No courses found.</CommandEmpty>
                          <CommandGroup>
                            {courses.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.id}
                                onSelect={(cur) => {
                                  setCourseId(cur === courseId ? "" : cur);
                                  setIsCourseComboOpen(false);
                                }}
                              >
                                <Icons.check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    courseId === c.id
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
                )}
              </div>
              <DialogFooter>
                <button
                  className={cn(buttonVariants())}
                  onClick={async (event) => {
                    event.preventDefault();
                    setIsUpdateLoading(true);
                    const updated = await updateLecture({
                      lectureId: lecture.id,
                      title: lectureName,
                      courseId,
                    });
                    if (updated) {
                      setIsUpdateLoading(false);
                      setIsEditDialogOpen(false);
                      router.refresh();
                      await utils.lecture.invalidate();
                    }
                  }}
                  disabled={isUpdateLoading}
                >
                  {isUpdateLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenuSeparator />
          <AlertDialog
            open={isDeleteAlertOpen}
            onOpenChange={setIsDeleteAlertOpen}
          >
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex w-full cursor-pointer items-center text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete lecture</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this lecture? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (event) => {
                    event.preventDefault();
                    setIsDeleteLoading(true);

                    try {
                      await deleteLecture(lecture.id);
                      setIsDeleteLoading(false);
                      setIsDeleteAlertOpen(false);
                      router.refresh();
                      await utils.lecture.invalidate();
                    } catch (error) {
                      console.error("Error deleting lecture:", error);
                      setIsDeleteLoading(false);
                      setIsDeleteAlertOpen(false);
                      toast.error(
                        "Something went wrong. Your lecture was not deleted. Please try again.",
                      );
                    }
                  }}
                  className="bg-red-600 focus:ring-red-600"
                >
                  {isDeleteLoading ? (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Icons.trash className="mr-2 h-4 w-4" />
                  )}
                  <span>Delete</span>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
