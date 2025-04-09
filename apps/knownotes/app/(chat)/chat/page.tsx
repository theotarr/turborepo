"use client";

import Link from "next/link";
import { ChatHeader } from "@/components/chat-header";
import { Icons } from "@/components/icons";
import { api } from "@/lib/trpc/react";
import { motion } from "framer-motion";

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ChatPage() {
  const { data: courses, isLoading } = api.course.list.useQuery();

  return (
    <>
      <ChatHeader />
      <div className="flex h-full flex-col items-center justify-center">
        <div className="mx-auto flex w-full max-w-3xl flex-col justify-center space-y-8 px-4 py-8 sm:px-8">
          <div className="flex flex-col space-y-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-semibold"
            >
              How can I help you today?
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.6 }}
              className="text-2xl text-muted-foreground"
            >
              Select a course for your AI tutor.
            </motion.div>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
            initial="hidden"
            animate="show"
            className="flex flex-col space-y-3 overflow-y-auto"
          >
            {isLoading ? (
              // Loading state
              <div className="flex flex-col space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 w-full animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : courses && courses.length > 0 ? (
              // Course list with animations
              courses.map((course) => (
                <motion.div key={course.id} variants={item}>
                  <Link
                    href={`/chat/${course.id}`}
                    className="flex items-center justify-between rounded-md border border-border p-4 transition-all hover:bg-muted hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center space-x-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icons.course className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h2 className="truncate text-base font-medium">
                        {course.name}
                      </h2>
                    </div>
                    <Icons.chevronRight className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Link>
                </motion.div>
              ))
            ) : (
              // No courses state
              <motion.div
                variants={item}
                className="flex flex-col items-center justify-center space-y-4 rounded-md border border-dashed border-border p-8 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Icons.add className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No courses yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a course to get started with your AI tutor
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
