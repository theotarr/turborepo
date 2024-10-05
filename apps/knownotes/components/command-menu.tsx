"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DialogProps } from "@radix-ui/react-alert-dialog"
import { useTheme } from "next-themes"
import { useDebouncedCallback } from "use-debounce"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

import { Icons } from "./icons"
import { Lecture } from "@prisma/client"
import { searchLectures } from "@/lib/lecture/actions"

type LectureCommandMenuProps = {
  lectures: Lecture[]
} & DialogProps

export function LectureCommandMenu({
  lectures,
  ...props
}: LectureCommandMenuProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [results, setResults] = React.useState<Lecture[]>(lectures)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedCallback(async (value: string) => {
    const searchResults = await searchLectures(value)
    setResults(searchResults)
  })
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={search}
          onValueChange={(search) => {
            setSearch(search)
            debouncedSearch(search)
          }}
          placeholder="Search your lectures..."
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Lectures">
              {results.map((lecture) => (
                <CommandItem
                  key={lecture.id}
                  onSelect={() =>
                    runCommand(() => {
                      router.push(`/lecture/${lecture.id}`)
                      router.refresh()
                    })
                  }
                >
                  <Icons.lecture className="mr-2 size-4" />
                  {lecture.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
