"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { UserSignUpQuestionType } from "@prisma/client";
import { toast } from "sonner";

interface UserWelcomeFormProps extends React.HTMLAttributes<HTMLDivElement> {}

async function submitQuestions(
  questions: {
    questionType: UserSignUpQuestionType;
    answer: string;
  }[],
) {
  const response = await fetch(`/api/feedback/welcome`, {
    method: "POST",
    body: JSON.stringify({
      questions,
    }),
  });

  if (!response?.ok) {
    toast(
      "Something went wrong. Your feedback was not saved. Please try again.",
    );
    return false;
  }
  return true;
}

export function UserWelcomeForm({ className, ...props }: UserWelcomeFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [howDidYouHearAboutUs, setHowDidYouHearAboutUs] =
    React.useState<string>("");
  const searchParams = useSearchParams();

  async function onSubmit() {
    setIsLoading(true);
    const result = await submitQuestions([
      {
        questionType: UserSignUpQuestionType.HOW_DID_YOU_HEAR_ABOUT_US,
        answer: howDidYouHearAboutUs,
      },
    ]);
    setIsLoading(false);

    if (!result) {
      return toast.error("Something went wrong. Please try again.");
    }

    toast.success("Success!");
    window.location.href = "/lecture";
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <div className="grid gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="hear-about-us">How did you hear about us?</Label>
          <Input
            placeholder="A friend"
            type="text"
            autoCapitalize="none"
            name="hear-about-us"
            value={howDidYouHearAboutUs}
            onChange={(e) => setHowDidYouHearAboutUs(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button
          onClick={() => onSubmit()}
          className={cn(buttonVariants(), "mt-4")}
          disabled={isLoading}
        >
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </button>
      </div>
    </div>
  );
}
