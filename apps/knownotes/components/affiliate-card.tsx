import React from "react"
import Link from "next/link"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

import { buttonVariants } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"

interface StaticAffiliateCardProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function StaticAffiliateCard({
  className,
  ...props
}: StaticAffiliateCardProps) {
  return (
    <Card
      className={cn("absolute bottom-4 right-4 z-50", className)}
      {...props}
    >
      <CardHeader>
        <CardTitle>Get Paid To Share</CardTitle>
        <CardDescription>
          For everyone you refer, we&apos;ll pay you $6.50/mo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          className={cn(
            buttonVariants({
              size: "sm",
              variant: "default",
            }),
            "w-full"
          )}
          target="_blank"
          href="https://affiliates.knownotes.ai"
        >
          Get Paid
        </Link>
      </CardContent>
    </Card>
  )
}

interface AffiliateCardProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
}

export function AffiliateCard({
  open,
  onClose,
  className,
  ...props
}: AffiliateCardProps) {
  return (
    <Card
      className={cn(
        "absolute bottom-4 right-4 z-50",
        className,
        !open && "hidden"
      )}
      {...props}
    >
      <div
        onClick={() => onClose()}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </div>
      <CardHeader>
        <CardTitle>Get Paid To Tell Your Friends</CardTitle>
        <CardDescription>
          For everyone you refer, we&apos;ll pay you $6.50/month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          className={cn(
            buttonVariants({
              size: "sm",
              variant: "default",
            }),
            "w-full"
          )}
          target="_blank"
          href="https://affiliates.knownotes.ai"
        >
          Get Paid
        </Link>
      </CardContent>
    </Card>
  )
}
