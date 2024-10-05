export function EmptyChat() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-6">
        <h1 className="text-lg font-semibold">
          Ask anything about your class.
        </h1>
        <p className="leading-normal text-muted-foreground">
          By using your uploaded lectures, notes, and files, we can answer any
          questions you have about your courses.
        </p>
        <p className="leading-normal text-muted-foreground">
          Try asking about something said in class, a topic you&apos;re
          studying, assignments, and more. Remember to be specific and provide
          as much detail as possible. Below are some examples to help you get
          started.
        </p>
      </div>
    </div>
  )
}
