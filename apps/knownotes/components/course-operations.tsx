"use client";

import { useState } from "react";
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
import { Course } from "@prisma/client";
import { toast } from "sonner";

import { deleteCourse, updateCourse } from "../app/(auth)/actions";

interface CourseOperationsProps {
  course: Course;
}

export function CourseOperations({ course }: CourseOperationsProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [courseName, setCourseName] = useState<string>(course.name);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted">
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
                <DialogTitle>Update course</DialogTitle>
                <DialogDescription>
                  Make changes to this course here. Click save when you&apos;re
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
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="col-span-3"
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter>
                <button
                  className={cn(buttonVariants({ size: "sm" }))}
                  onClick={async (event) => {
                    event.preventDefault();
                    setIsUpdateLoading(true);

                    try {
                      await updateCourse(course.id, courseName);
                      setIsUpdateLoading(false);
                      setIsEditDialogOpen(false);
                      utils.course.invalidate();
                      router.refresh();
                    } catch (error) {
                      console.error(error);
                      toast.error(
                        "Something went wrong. Your course was not updated. Please try again.",
                      );
                    } finally {
                      setIsUpdateLoading(false);
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
                <AlertDialogTitle>
                  Are you sure you want to delete this course?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async (event) => {
                    event.preventDefault();
                    setIsDeleteLoading(true);

                    try {
                      await deleteCourse(course.id);
                      setIsDeleteLoading(false);
                      setIsDeleteAlertOpen(false);
                      router.push("/dashboard");
                      utils.course.invalidate();
                      router.refresh();
                    } catch (error) {
                      console.error(error);
                      toast.error(
                        "Something went wrong. Your course was not deleted. Please try again.",
                      );
                    } finally {
                      setIsDeleteLoading(false);
                    }
                  }}
                  className={cn(
                    buttonVariants({ size: "sm", variant: "destructive" }),
                  )}
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
