"use client";

import { buttonVariants } from "./ui/button";

export function MobileButton({ sessionToken }) {
  return (
    <button
      className={buttonVariants()}
      onClick={() => {
        window.location.href = `https://knownotes.ai/mobile?session_token=${sessionToken}`;
      }}
    >
      Go to app
    </button>
  );
}
