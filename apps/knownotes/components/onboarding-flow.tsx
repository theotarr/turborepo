"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Course } from "@prisma/client"

import { cn } from "@/lib/utils"

import { AddCoursesForm } from "./add-courses-form"
import { Icons } from "./icons"
import { Button } from "./ui/button"
import Image from "next/image"
import Link from "next/link"

interface OnboardingProps extends React.HTMLAttributes<HTMLDivElement> {
  courses: Course[]
}

export function Onboarding({ courses, className, ...props }: OnboardingProps) {
  const router = useRouter()
  const [step, setStep] = React.useState(0)

  return (
    <div
      className={cn("flex w-full flex-col items-center space-y-6", className)}
      {...props}
    >
      {step === 0 ? (
        <div className="w-full sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Icons.logo className="mx-auto h-8 w-8" />
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
      ) : (
        <>
          <div className="flex flex-col space-y-2 text-center">
            <div className="max-w-[350px]">
              <Icons.logo className="mx-auto h-8 w-8" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Tutorial
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s a quick tutorial on how to use KnowNotes to help you
                save time and study more effectively.
              </p>
            </div>
          </div>
          {/* <video
            autoPlay
            className="w-[680px] rounded-lg shadow-lg"
            src="https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528?sid=94a40531-7cf3-48e4-826b-655bd32ee8be"
          /> */}
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
          step < 1 ? setStep((prev) => prev + 1) : router.push("/dashboard")
        }
      >
        Continue
      </Button>
    </div>
  )
}
