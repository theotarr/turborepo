"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Course } from "@prisma/client"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
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
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"

async function deleteCourse(courseId: string) {
  const response = await fetch(`/api/course/${courseId}`, {
    method: "DELETE",
  })

  if (!response?.ok) {
    toast.error(
      "Something went wrong. Your course was not deleted. Please try again."
    )
    return false
  }

  return true
}

async function updateCourse(courseId: string, name: string) {
  const response = await fetch(`/api/course/${courseId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
    }),
  })

  if (!response?.ok) {
    toast.error(
      "Something went wrong. Your course was not updated. Please try again."
    )
    return false
  }

  return true
}

interface CourseOperationsProps {
  course: Course
}

export function CourseOperations({ course }: CourseOperationsProps) {
  const router = useRouter()

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [isDeleteLoading, setIsDeleteLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUpdateLoading, setIsUpdateLoading] = useState(false)
  const [courseName, setCourseName] = useState<string>(course.name)

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
                  className={cn(buttonVariants())}
                  onClick={async (event) => {
                    event.preventDefault()
                    setIsUpdateLoading(true)
                    const updated = await updateCourse(course.id, courseName)
                    if (updated) {
                      setIsUpdateLoading(false)
                      setIsEditDialogOpen(false)
                      router.refresh()
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
                    event.preventDefault()
                    setIsDeleteLoading(true)
                    const deleted = await deleteCourse(course.id)
                    if (deleted) {
                      setIsDeleteLoading(false)
                      setIsDeleteAlertOpen(false)
                      router.push("/dashboard")
                      router.refresh()
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
  )
}
