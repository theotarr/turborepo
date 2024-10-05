import { cn } from "@/lib/utils"

import { Icons } from "./icons"

interface TrustPilotProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TrustPilot({ className, ...props }: TrustPilotProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 sm:flex-row",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center justify-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Icons.star
              key={i}
              className="size-3 fill-primary text-primary sm:size-4"
            />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">4.8/5</p>
        <Icons.trustPilot className="-mt-1 w-16 text-secondary-foreground sm:w-20" />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Loved by <span className="font-semibold">10,000+</span> students
      </p>
    </div>
  )
}
