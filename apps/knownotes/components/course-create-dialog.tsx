"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import { Icons } from "./icons"
import { Input } from "./ui/input"

async function createCourse({ name }: { name: string }) {
  const response = await fetch(`/api/course`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
    }),
  })
  const { courseId } = await response.json()
  return {
    courseId,
  }
}

interface CourseCreateDialogProps {
  className?: string
  [key: string]: any
}

export function CourseCreateDialog({ className }: CourseCreateDialogProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const { courseId } = await createCourse({ name })
    setIsLoading(false)
    if (!courseId) {
      return toast.error("Something went wrong. Please try again.")
    } else {
      toast.success("Success!")
      router.push(`/course/${courseId}`)
      router.refresh()
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={
            className
              ? className
              : buttonVariants({ variant: "outline", size: "sm" })
          }
        >
          <Icons.add className="mr-2 h-4 w-4 sm:hidden" />
          <div className="mr-1 hidden sm:inline">Add </div> Course
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Course</DialogTitle>
          <DialogDescription>
            Create a new course to organize your lectures.
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
            className={cn(buttonVariants())}
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
  )
}
