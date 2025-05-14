"use client";

import { HTMLAttributes, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CourseCreateDialog } from "@/components/course-create-dialog";
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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { deleteLecture, updateLecture } from "@/lib/lecture/actions";
import { api } from "@/lib/trpc/react";
import { absoluteUrl, cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface LectureOperationsProps extends HTMLAttributes<HTMLDivElement> {
  lecture: {
    id: string;
    title: string;
    courseId?: string | null;
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
  const pathname = usePathname();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);

  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const shareUrl = absoluteUrl(`/share/lecture/${lecture.id}`);

  const [isCourseComboOpen, setIsCourseComboOpen] = useState(false);
  const [courseId, setCourseId] = useState<string | undefined>(
    lecture.courseId ?? undefined,
  );
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] =
    useState(false);

  const [lectureName, setLectureName] = useState<string>(lecture.title);

  // Handle copying the share URL
  const handleCopy = () => {
    copyToClipboard(shareUrl);
  };

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
            className="flex w-full"
            onSelect={(e) => {
              e.preventDefault();
              setIsEditDialogOpen(true);
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex w-full"
            onSelect={(e) => {
              e.preventDefault();
              setIsShareDialogOpen(true);
            }}
          >
            Share
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Lecture</DialogTitle>
            <DialogDescription>
              Change the title and course of this lecture. Save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={lectureName}
                onChange={(e) => setLectureName(e.target.value)}
                className="col-span-3"
                autoComplete="off"
              />
            </div>
            {courses && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="course" className="text-right">
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
                                courseId === c.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup className="border-t pt-1">
                        <CommandItem
                          onSelect={() => {
                            setIsCourseComboOpen(false);
                            setIsCreateCourseDialogOpen(true);
                          }}
                          className="text-sm"
                        >
                          <Plus className="mr-2 size-4" />
                          New Course
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              size="sm"
              onClick={async (event) => {
                event.preventDefault();
                setIsUpdateLoading(true);

                try {
                  await updateLecture({
                    lectureId: lecture.id,
                    title: lectureName,
                    courseId,
                  });
                } catch (error) {
                  console.error("Error updating lecture:", error);
                  setIsUpdateLoading(false);
                  setIsEditDialogOpen(false);
                  toast.error("Something went wrong. Please try again.");
                }
                setIsUpdateLoading(false);
                setIsEditDialogOpen(false);
                router.refresh();
                await utils.lecture.invalidate();
              }}
              disabled={isUpdateLoading}
            >
              {isUpdateLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
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

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lecture</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lecture? This action cannot
              be undone.
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

                  // Check if current route starts with /lecture and redirect to dashboard if so
                  if (pathname.startsWith("/lecture"))
                    router.push("/dashboard");

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
              className={cn(
                buttonVariants({ size: "sm", variant: "destructive" }),
              )}
            >
              {isDeleteLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <></>
              )}
              <span>Delete</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course Create Dialog for Lecture Operations */}
      <CourseCreateDialog
        open={isCreateCourseDialogOpen}
        onOpenChange={setIsCreateCourseDialogOpen}
        onCourseCreated={(newCourse) => {
          setIsCreateCourseDialogOpen(false); // Close the creation dialog
          setCourseId(newCourse.id); // Auto-select the new course in the Edit Lecture dialog
          // The router.refresh() and utils.course.invalidate() in CourseCreateDialog
          // should handle updating the courses list for the Popover.
        }}
      />
    </>
  );
}
