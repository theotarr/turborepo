"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

import { ChatOperations } from "./chat-operations";
import { CourseCreateDialog } from "./course-create-dialog";
import { Icons } from "./icons";
import { LectureOperations } from "./lecture-operations";
import { UserAccountNav } from "./user-account-nav";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const { data: session } = api.auth.getSession.useQuery();
  const { data: lectures, isLoading: lecturesLoading } =
    api.lecture.list.useQuery();
  const { data: chats, isLoading: chatsLoading } = api.chat.list.useQuery();
  const { data: courses, isLoading: coursesLoading } = api.course.list.useQuery(
    undefined,
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  );

  // Helper to get appropriate icon based on lecture type
  const getLectureIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <Icons.text className="mr-2 size-4" />;
      case "AUDIO_FILE":
        return <Icons.audio className="mr-2 size-4" />;
      case "YOUTUBE":
        return <Icons.youtube className="mr-2 size-4" />;
      case "PDF":
        return <Icons.file className="mr-2 size-4" />;
      case "DOCX":
        return <Icons.file className="mr-2 size-4" />;
      case "LIVE":
        return <Icons.mic className="mr-2 size-4" />;
      default:
        return <Icons.mic className="mr-2 size-4" />;
    }
  };

  // Check if a chat is active
  const isChatActive = (chatId: string, courseId: string) => {
    return pathname === `/chat/${courseId}/${chatId}`;
  };

  return (
    <TooltipProvider>
      <Sidebar className="border-sidebar-border border-r">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between p-2">
              <Link
                href="/dashboard"
                onClick={() => setOpenMobile(false)}
                className="flex flex-row items-center gap-2 font-bold tracking-tighter text-secondary-foreground"
              >
                <Icons.logo className="size-6" />
                KnowNotes
              </Link>
            </div>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* New Chat Button */}
          <SidebarGroup>
            <Link
              href="/chat"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              New Chat
            </Link>
          </SidebarGroup>

          {/* Recent Notes Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>Recent Notes</span>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="-mr-2 size-7 border-0 bg-transparent p-0"
                >
                  <Icons.add className="size-4" />
                </Button>
              </Link>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {lecturesLoading ? (
                  // Loading skeleton for lectures
                  Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={`lecture-skeleton-${index}`}>
                      <div className="px-2 py-1.5">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    </SidebarMenuItem>
                  ))
                ) : lectures && lectures.length > 0 ? (
                  lectures.map((lecture) => {
                    const isActive = pathname === `/lecture/${lecture.id}`;
                    return (
                      <SidebarMenuItem key={lecture.id}>
                        <div
                          className={cn(
                            "group flex w-full items-center justify-between rounded-md transition-colors",
                            isActive ? "bg-secondary" : "hover:bg-secondary/50",
                          )}
                        >
                          <SidebarMenuButton
                            onClick={() =>
                              router.push(`/lecture/${lecture.id}`)
                            }
                            tooltip={lecture.title}
                            className={cn(
                              "flex-1 hover:bg-transparent",
                              isActive && "font-medium",
                            )}
                            isActive={isActive}
                          >
                            {getLectureIcon(lecture.type)}
                            <span className="truncate">{lecture.title}</span>
                          </SidebarMenuButton>
                          <div className="flex items-center gap-1">
                            {lecture.courseId &&
                              courses?.find(
                                (c) => c.id === lecture.courseId,
                              ) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex h-6 w-6 items-center justify-center">
                                      <Icons.course className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    {
                                      courses.find(
                                        (c) => c.id === lecture.courseId,
                                      )?.name
                                    }
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            <LectureOperations
                              lecture={lecture}
                              courses={courses}
                              className={cn(
                                "size-7 flex-shrink-0 border-0 bg-transparent text-muted-foreground/60",
                                isActive
                                  ? "text-foreground/80 hover:text-foreground"
                                  : "group-hover:text-foreground",
                              )}
                            />
                          </div>
                        </div>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <SidebarMenuItem>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No recent notes
                    </div>
                  </SidebarMenuItem>
                )}
                <Link
                  href="/library?tab=notes"
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    }),
                    "w-full justify-start bg-transparent text-xs text-muted-foreground hover:bg-transparent hover:underline",
                  )}
                >
                  View all <Icons.chevronRight className="ml-2 size-4" />
                </Link>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Recent Chats Section */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <span>Recent Chats</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chatsLoading ? (
                  // Loading skeleton for chats
                  Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={`chat-skeleton-${index}`}>
                      <div className="px-2 py-1.5">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    </SidebarMenuItem>
                  ))
                ) : chats && chats.length > 0 ? (
                  chats.map((chat) => {
                    const isActive = isChatActive(chat.id, chat.courseId);
                    return (
                      <SidebarMenuItem key={chat.id}>
                        <div
                          className={cn(
                            "group flex w-full items-center justify-between rounded-md transition-colors",
                            isActive ? "bg-secondary" : "hover:bg-secondary/50",
                          )}
                        >
                          <SidebarMenuButton
                            onClick={() =>
                              router.push(`/chat/${chat.courseId}/${chat.id}`)
                            }
                            tooltip={chat.name}
                            className={cn(
                              "flex-1 hover:bg-transparent",
                              isActive && "font-medium",
                            )}
                            isActive={isActive}
                          >
                            <span className="truncate">{chat.name}</span>
                          </SidebarMenuButton>
                          <div className="flex items-center gap-1">
                            {courses?.find((c) => c.id === chat.courseId) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex h-6 w-6 items-center justify-center">
                                    <Icons.course className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  {
                                    courses.find((c) => c.id === chat.courseId)
                                      ?.name
                                  }
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <ChatOperations
                              chat={chat}
                              className={cn(
                                "size-7 flex-shrink-0 border-0 bg-transparent text-muted-foreground/60",
                                isActive
                                  ? "text-foreground/80 hover:text-foreground"
                                  : "group-hover:text-foreground",
                              )}
                            />
                          </div>
                        </div>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <SidebarMenuItem>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No recent chats
                    </div>
                  </SidebarMenuItem>
                )}
                <Link
                  href="/library?tab=chats"
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    }),
                    "w-full justify-start bg-transparent text-xs text-muted-foreground hover:bg-transparent hover:underline",
                  )}
                >
                  View all <Icons.chevronRight className="ml-2 size-4" />
                </Link>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Courses Section */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <div className="flex w-full items-center justify-between">
                <span>Your Courses</span>
                <CourseCreateDialog
                  className={cn("-mr-2 h-7 w-7 border-0 bg-transparent p-0")}
                />
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {coursesLoading ? (
                  // Loading skeleton for courses
                  Array.from({ length: 3 }).map((_, index) => (
                    <SidebarMenuItem key={`course-skeleton-${index}`}>
                      <div className="px-2 py-1.5">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    </SidebarMenuItem>
                  ))
                ) : courses && courses.length > 0 ? (
                  courses.map((course) => (
                    <SidebarMenuItem key={course.id}>
                      <SidebarMenuButton
                        onClick={() => router.push(`/course/${course.id}`)}
                        tooltip={course.name}
                      >
                        <Icons.course className="mr-2 size-4" />
                        <span>{course.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No courses yet.
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <div className="flex items-center justify-between">
            {session?.user && (
              <UserAccountNav
                user={{
                  name: session.user.name || null,
                  email: session.user.email || null,
                  image: session.user.image || null,
                }}
                showFullInfo={true}
                className="flex-1"
              />
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
