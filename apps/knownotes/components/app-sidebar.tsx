"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDebounce } from "use-debounce";

import { ChatOperations } from "./chat-operations";
import { CourseCreateDialog } from "./course-create-dialog";
import { Icons } from "./icons";
import { LectureOperations } from "./lecture-operations";
import { UserAccountNav } from "./user-account-nav";

const getLectureIcon = (type: string) => {
  switch (type) {
    case "TEXT":
      return <Icons.text className="size-4" />;
    case "AUDIO_FILE":
      return <Icons.audio className="size-4" />;
    case "YOUTUBE":
      return <Icons.youtube className="size-4" />;
    case "PDF":
      return <Icons.file className="size-4" />;
    case "DOCX":
      return <Icons.file className="size-4" />;
    case "LIVE":
      return <Icons.mic className="size-4" />;
    default:
      return <Icons.mic className="size-4" />;
  }
};

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [isSearching, setIsSearching] = useState(false);

  // Effect to handle loading indicator between query change and debounce completion
  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [query, debouncedQuery]);

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

  // Filter items based on search query
  const filteredLectures = useMemo(() => {
    if (!lectures || !debouncedQuery.trim()) return lectures;
    return lectures.filter((lecture) =>
      lecture.title.toLowerCase().includes(debouncedQuery.toLowerCase()),
    );
  }, [lectures, debouncedQuery]);

  const filteredChats = useMemo(() => {
    if (!chats || !debouncedQuery.trim()) return chats;
    return chats.filter((chat) =>
      chat.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
    );
  }, [chats, debouncedQuery]);

  const filteredCourses = useMemo(() => {
    if (!courses || !debouncedQuery.trim()) return courses;
    return courses.filter((course) =>
      course.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
    );
  }, [courses, debouncedQuery]);

  // Check if a chat is active
  const isChatActive = (chatId: string, courseId: string) => {
    return pathname === `/chat/${courseId}/${chatId}`;
  };

  return (
    <TooltipProvider>
      <Sidebar className="border-sidebar-border border-r">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between px-2 pt-2">
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
          <SidebarGroup className="mt-2 py-1">
            <SidebarMenu>
              <Button
                variant="outline"
                size="sm"
                className="border-2 border-dashed"
                onClick={() => router.push("/dashboard")}
              >
                <Icons.add className="mr-2 size-4" />
                Add content
              </Button>
            </SidebarMenu>

            {/* Search Bar */}
            <div className="relative mt-2">
              <div className="relative flex items-center border-b border-border">
                <div className="pointer-events-none absolute left-2 flex h-full items-center text-muted-foreground/50">
                  {isSearching ? (
                    <Icons.spinner className="size-3.5 animate-spin" />
                  ) : (
                    <Icons.search className="size-4" />
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="Search your notes..."
                  className="h-9 w-full border-none bg-transparent pl-8 text-[0.8rem] focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <div className="absolute right-2 flex h-full items-center">
                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuery("")}
                      className="h-6 w-6 rounded-md p-0"
                    >
                      <Icons.close className="size-3.5" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SidebarGroup>

          {/* Notes Section - only show if no query or if there are matching results */}
          {(!debouncedQuery ||
            (filteredLectures && filteredLectures.length > 0)) && (
            <SidebarGroup>
              <SidebarGroupLabel>Notes</SidebarGroupLabel>
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
                  ) : filteredLectures && filteredLectures.length > 0 ? (
                    <div>
                      {filteredLectures.map((lecture) => {
                        const isActive = pathname === `/lecture/${lecture.id}`;
                        return (
                          <SidebarMenuItem
                            key={`lecture-sidebar-${lecture.id}`}
                          >
                            <div
                              className={cn(
                                "hover:bg-sidebar-accent group flex w-full items-center justify-between rounded-md",
                                isActive &&
                                  "bg-sidebar-accent text-sidebar-accent-foreground",
                              )}
                            >
                              <SidebarMenuButton
                                onClick={() =>
                                  router.push(`/lecture/${lecture.id}`)
                                }
                                isActive={isActive}
                              >
                                {isActive ? (
                                  <div className="flex size-2 flex-shrink-0 rounded-full bg-primary" />
                                ) : (
                                  getLectureIcon(lecture.type)
                                )}
                                <span className="truncate">
                                  {lecture.title}
                                </span>
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
                      })}
                    </div>
                  ) : (
                    <SidebarMenuItem>
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {debouncedQuery
                          ? "No results found"
                          : "No recent notes"}
                      </div>
                    </SidebarMenuItem>
                  )}
                  {!debouncedQuery && (
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
                  )}
                  {debouncedQuery && (
                    <Link
                      href={`/library?tab=notes&q=${encodeURIComponent(debouncedQuery)}`}
                      className={cn(
                        buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        }),
                        "w-full justify-start bg-transparent text-xs text-muted-foreground hover:bg-transparent hover:underline",
                      )}
                    >
                      View all results{" "}
                      <Icons.chevronRight className="ml-2 size-4" />
                    </Link>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Chats Section - only show if no query or if there are matching results */}
          {(!debouncedQuery || (filteredChats && filteredChats.length > 0)) && (
            <SidebarGroup>
              <SidebarGroupLabel>
                <span>Chats</span>
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
                  ) : filteredChats && filteredChats.length > 0 ? (
                    <div>
                      {filteredChats.map((chat, index) => {
                        const isActive = isChatActive(chat.id, chat.courseId);
                        return (
                          <SidebarMenuItem key={chat.id}>
                            <div
                              className={cn(
                                "group flex w-full items-center justify-between rounded-md transition-colors",
                                isActive
                                  ? "bg-secondary"
                                  : "hover:bg-secondary/50",
                              )}
                            >
                              <SidebarMenuButton
                                onClick={() =>
                                  router.push(
                                    `/chat/${chat.courseId}/${chat.id}`,
                                  )
                                }
                                className={cn(
                                  "flex-1 hover:bg-transparent",
                                  isActive && "font-medium",
                                )}
                                isActive={isActive}
                              >
                                {isActive && (
                                  <div className="flex size-2 flex-shrink-0 rounded-full bg-primary" />
                                )}
                                <span className="truncate">{chat.name}</span>
                              </SidebarMenuButton>
                              <div className="flex items-center gap-1">
                                {courses?.find(
                                  (c) => c.id === chat.courseId,
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
                                          (c) => c.id === chat.courseId,
                                        )?.name
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
                      })}
                    </div>
                  ) : (
                    <SidebarMenuItem>
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {debouncedQuery
                          ? "No results found"
                          : "No recent chats"}
                      </div>
                    </SidebarMenuItem>
                  )}
                  {!debouncedQuery && (
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
                  )}
                  {debouncedQuery && (
                    <Link
                      href={`/library?tab=chats&q=${encodeURIComponent(debouncedQuery)}`}
                      className={cn(
                        buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        }),
                        "w-full justify-start bg-transparent text-xs text-muted-foreground hover:bg-transparent hover:underline",
                      )}
                    >
                      View all results{" "}
                      <Icons.chevronRight className="ml-2 size-4" />
                    </Link>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Courses Section - only show if no query or if there are matching results */}
          {(!debouncedQuery ||
            (filteredCourses && filteredCourses.length > 0)) && (
            <SidebarGroup>
              <SidebarGroupLabel>
                <div className="flex w-full items-center justify-between">
                  <span>Courses</span>
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
                  ) : filteredCourses && filteredCourses.length > 0 ? (
                    <div>
                      {filteredCourses.map((course) => (
                        <SidebarMenuItem key={`course-sidebar-${course.id}`}>
                          <SidebarMenuButton
                            onClick={() => router.push(`/chat/${course.id}`)}
                            className="gap-2"
                          >
                            <div className="flex w-4 flex-shrink-0 items-center justify-center">
                              {pathname === `/chat/${course.id}` ? (
                                <div className="size-2 rounded-full bg-primary" />
                              ) : (
                                <Icons.course className="size-4" />
                              )}
                            </div>
                            <span>{course.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  ) : (
                    <SidebarMenuItem>
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {debouncedQuery
                          ? "No results found"
                          : "No courses yet."}
                      </div>
                    </SidebarMenuItem>
                  )}
                  {debouncedQuery && courses && courses.length > 0 && (
                    <Link
                      href={`/library?q=${encodeURIComponent(debouncedQuery)}`}
                      className={cn(
                        buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        }),
                        "w-full justify-start bg-transparent text-xs text-muted-foreground hover:bg-transparent hover:underline",
                      )}
                    >
                      View all results{" "}
                      <Icons.chevronRight className="ml-2 size-4" />
                    </Link>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
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
