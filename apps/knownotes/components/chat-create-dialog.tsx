"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Icons } from "./icons"

interface ChatCreateDialogProps {
  courses: {
    id: string
    name: string
  }[]
  className?: string
  [key: string]: any
}

export function ChatCreateDialog({
  courses,
  className,
}: ChatCreateDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState("")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={
            className
              ? className
              : cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 w-full justify-start px-4 shadow-none"
                )
          }
        >
          <Icons.add className="-translate-x-2 stroke-2" />
          New Chat
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pb-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Course
            </Label>
            <Popover
              open={coursePopoverOpen}
              onOpenChange={setCoursePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-[280px] justify-between"
                >
                  {selectedCourseId
                    ? courses.find((c) => c.id === selectedCourseId)?.name
                    : "Select course..."}
                  <Icons.chevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="mr-[80px] w-[360px] p-0">
                <Command>
                  <CommandInput placeholder="Search your courses..." />
                  <CommandEmpty>
                    <CommandItem
                      value={"create"}
                      //   onSelect={(cur) => {
                      //     setValue(cur === value ? "" : cur)
                      //     setCoursePopoverOpen(false)
                      //   }}
                    >
                      {/* <Icons.add
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCourseId === "create"
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      /> */}
                      No courses found, create one.
                    </CommandItem>
                  </CommandEmpty>
                  <CommandGroup>
                    {courses.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.id}
                        onSelect={(cur) => {
                          setSelectedCourseId(
                            cur === selectedCourseId ? "" : cur
                          )
                          setCoursePopoverOpen(false)
                        }}
                      >
                        <Icons.check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCourseId === c.id
                              ? "opacity-100"
                              : "opacity-0"
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
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              router.push(`/chat/${selectedCourseId}`)
              setOpen(false)
            }}
          >
            New Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
