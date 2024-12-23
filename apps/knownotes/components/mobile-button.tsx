"use client";

import { cn } from "@/lib/utils";

import { Icons } from "./icons";
import { buttonVariants } from "./ui/button";

export function MobileButton({ sessionToken }) {
  return (
    <a
      href={`knownotes://mobile?session_token=${sessionToken}`}
      className={cn(buttonVariants(), "flex items-center justify-center")}
    >
      Continue
      <Icons.arrowRight className="ml-2 size-4" aria-hidden="true" />
    </a>
  );
}
