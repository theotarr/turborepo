"use client";

import { buttonVariants } from "./ui/button";

export function MobileButton({ sessionToken }) {
  return (
    <a
      href={`knownotes://mobile?session_token=${sessionToken}`}
      className={buttonVariants()}
    >
      Go to app
    </a>
  );
}
