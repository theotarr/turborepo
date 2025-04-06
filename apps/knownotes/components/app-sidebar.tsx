"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
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
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";

import { Icons } from "./icons";
import { LectureOperations } from "./lecture-operations";
import { UserAccountNav } from "./user-account-nav";

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const { data: session } = api.auth.getSession.useQuery();
  const { data: lectures, isLoading: lecturesLoading } =
    api.lecture.byUser.useQuery();
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
    <Sidebar className="border-sidebar-border border-r">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between p-2">
            <Link
              href="/dashboard"
              onClick={() => setOpenMobile(false)}
              className="flex flex-row items-center gap-2 font-bold tracking-tight"
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
          <SidebarGroupLabel>
            <span>Recent Notes</span>
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
                lectures.slice(0, 5).map((lecture) => (
                  <SidebarMenuItem key={lecture.id}>
                    <div className="flex w-full items-center justify-between">
                      <SidebarMenuButton
                        onClick={() => router.push(`/lecture/${lecture.id}`)}
                        tooltip={lecture.title}
                        className="flex-1"
                      >
                        {getLectureIcon(lecture.type)}
                        <span className="truncate">{lecture.title}</span>
                      </SidebarMenuButton>
                      <LectureOperations
                        lecture={lecture}
                        courses={courses}
                        className="ml-2 flex-shrink-0"
                      />
                    </div>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No recent notes
                  </div>
                </SidebarMenuItem>
              )}
              <Link
                href="/dashboard/lectures"
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
              ) : chats && Object.keys(chats).length > 0 ? (
                Object.entries(chats)
                  .flatMap(([courseName, courseChats]) =>
                    courseChats.slice(0, 2).map((chat) => {
                      const isActive = isChatActive(chat.id, chat.courseId);
                      return (
                        <SidebarMenuItem key={chat.id}>
                          <SidebarMenuButton
                            onClick={() =>
                              router.push(`/chat/${chat.courseId}/${chat.id}`)
                            }
                            tooltip={chat.name}
                            className={cn(
                              "w-full",
                              isActive && "bg-secondary font-medium",
                            )}
                            isActive={isActive}
                          >
                            <span>{chat.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }),
                  )
                  .slice(0, 5)
              ) : (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No recent chats
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Courses Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <span>Your Courses</span>
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
                    No courses found
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
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
  );
}
