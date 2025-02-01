"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";

import { AddCoursesForm } from "./add-courses-form";
import { Icons } from "./icons";
import { Button } from "./ui/button";

interface OnboardingProps extends React.HTMLAttributes<HTMLDivElement> {
  courses: Course[];
}

export function Onboarding({ courses, className, ...props }: OnboardingProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);

  return (
    <div
      className={cn("flex w-full flex-col items-center space-y-6", className)}
      {...props}
    >
      <Icons.logo className="mx-autosize-8" />
      {step === 0 ? (
        <div className="w-full sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Add your courses
            </h1>
            <p className="text-sm text-muted-foreground">
              We group your lectures by course to create a personal AI tutor for
              each course.
            </p>
          </div>
          <AddCoursesForm courses={courses} />
        </div>
      ) : step === 1 ? (
        <>
          <div className="flex flex-col space-y-2 text-center">
            <div className="max-w-[350px]">
              <h1 className="text-2xl font-semibold tracking-tight">
                Download our app
              </h1>
              <p className="text-sm text-muted-foreground">
                Sync your notes to your phone. Scan the QR code below to
                download our app.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-primary/5 p-3 ring-1 ring-inset ring-primary/10">
            <Image
              src="/qrcode.png"
              alt="QR Code"
              width={184}
              height={184}
              className="mb-2 rounded-xl"
            />
            <p className="text-xl font-semibold tracking-tight text-secondary-foreground">
              Scan on iPhone
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col space-y-2 text-center">
            <div className="max-w-[350px]">
              <h1 className="text-2xl font-semibold tracking-tight">
                Tutorial
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s a quick tutorial on how to use KnowNotes to help you
                save time and study more effectively.
              </p>
            </div>
          </div>
          <div>
            <Link
              target="_blank"
              href="https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528"
            >
              <Image
                alt="KnowNotes Tutorial Video"
                width={600}
                height={383}
                className="rounded-lg shadow-lg"
                src="https://cdn.loom.com/sessions/thumbnails/5f1fbb33b9a44d5ab2d61928d30af528-with-play.gif"
              />
            </Link>
          </div>
        </>
      )}
      <Button
        className={cn("w-full", step > 0 && "max-w-[350px]")}
        variant={step < 2 ? "secondary" : "default"}
        onClick={() =>
          step < 2 ? setStep((prev) => prev + 1) : router.push("/dashboard")
        }
      >
        Continue
      </Button>
    </div>
  );
}
