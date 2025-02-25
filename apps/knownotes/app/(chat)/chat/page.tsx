"use client";

import Link from "next/link";
import { Icons } from "@/components/icons";
import { api } from "@/lib/trpc/react";

export default function ChatPage() {
  const { data: courses } = api.course.list.useQuery();
  return (
    <>
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mx-auto mb-12 flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-6 text-center">
            <Icons.logo className="mx-auto h-12 w-12" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                How can I help you today?
              </h1>
              <p className="mt-1 text-center text-sm text-secondary-foreground/70">
                Get help on any of your assignments, homework, studying, or any
                questions you have about the class.
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            {courses?.map((course) => (
              <Link
                key={course.id}
                href={`/chat/${course.id}`}
                className="flex items-center justify-between rounded-md border border-border px-4 py-2 hover:bg-muted"
              >
                <h2 className="text-base font-medium">{course.name}</h2>
                <Icons.chevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
