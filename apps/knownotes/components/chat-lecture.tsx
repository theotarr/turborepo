"use client"

import { useState } from "react"
import { Message } from "ai/react"
import { useActions, useUIState } from "ai/rsc"

import { sendGAEvent } from "@/lib/analytics"

import { PromptForm } from "./chat-form"
import { ChatList } from "./chat-list"
import { UserMessage } from "./message"
import { useNotesStore, useTranscriptStore } from "./notes-page"
import { Button, buttonVariants } from "./ui/button"
import { Separator } from "./ui/separator"
import { Icons } from "./icons"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { toast } from "sonner"
import { absoluteUrl, cn } from "@/lib/utils"
import Link from "next/link"

const CHAT_TEMPLATES = [
  "List key concepts",
  "Summarize lecture",
  "Answer question",
]

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messages?: Message[]
  onMessage?: (message: Message) => void
  lectureId: string
}

export function Chat({
  messages: savedMessages,
  lectureId,
  ...props
}: ChatProps) {
  const { copyToClipboard } = useCopyToClipboard({})
  const { transcript } = useTranscriptStore()
  const { editor, enhancedNotes } = useNotesStore()
  // const [aiState] = useAIState()
  const [messages, setMessages] = useUIState()
  const [input, setInput] = useState("")
  const { submitLectureMessage } = useActions()
  const isLoading = true

  return (
    <div {...props}>
      <div className="flex w-full flex-col">
        <div className="max-h-screen overflow-y-scroll pb-72">
          <div className="mt-4 flex flex-col items-start gap-2 px-4">
            {enhancedNotes && (
              <>
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Study Lecture
                </p>
                <div className="mb-2 flex space-x-2">
                  <Link
                    href={`/lecture/${lectureId}/flashcards`}
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        size: "sm",
                      })
                    )}
                  >
                    <Icons.flashcards className="mr-2 size-4" />
                    Review flashcards
                  </Link>
                  <Link
                    href={`/lecture/${lectureId}/quiz`}
                    className={cn(
                      buttonVariants({
                        variant: "default",
                        size: "sm",
                      })
                    )}
                  >
                    <Icons.quiz className="mr-2 size-4" />
                    Take the quiz
                  </Link>
                </div>
                <Separator />
              </>
            )}
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Share Notes
            </p>
            <div className="mb-2 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard(absoluteUrl(`/share/lecture/${lectureId}`))
                  sendGAEvent("event", "copy_link", {
                    url: window.location.href,
                  })
                  toast.success("Link copied to clipboard.")
                }}
              >
                <Icons.link className="mr-2 size-4" />
                Copy link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard(editor?.storage.markdown.getMarkdown())
                  sendGAEvent("event", "copy_notes")
                  toast.success("Notes copied to clipboard.")
                }}
              >
                <Icons.copy className="mr-2 size-4" />
                Copy notes
              </Button>
            </div>
            <Separator />
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              Ask KnowNotes
            </p>
            {messages.length === 0 &&
              CHAT_TEMPLATES.map((template, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    sendGAEvent("event", "submit_chat_template", {
                      template,
                    })

                    // Optimistically add the user message to the chat.
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: new Date().getTime(),
                        role: "user" as
                          | "function"
                          | "assistant"
                          | "user"
                          | "system",
                        display: <UserMessage>{template}</UserMessage>,
                      },
                    ])

                    // Submit the user message to the server.
                    const message = await submitLectureMessage(
                      template,
                      lectureId,
                      transcript
                    )
                    setMessages((prev) => [...prev, message])
                    setInput("")
                  }}
                >
                  {template}
                </Button>
              ))}
          </div>
          <ChatList className="mr-2 mt-6 md:ml-12" messages={messages} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto sm:max-w-2xl sm:px-4">
          <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
            <PromptForm
              placeholder="Ask about the lecture..."
              onSubmit={async (input) => {
                sendGAEvent("event", "submit_chat_form", {
                  prompt: input,
                })
                setMessages((prev) => [
                  ...prev,
                  {
                    id: new Date().getTime(),
                    role: "user" as
                      | "function"
                      | "assistant"
                      | "user"
                      | "system",
                    display: <UserMessage>{input}</UserMessage>,
                  },
                ])

                // Submit the user message to the server.
                const message = await submitLectureMessage(
                  input,
                  lectureId,
                  transcript
                )
                setMessages((prev) => [...prev, message])
                setInput("")
              }}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
