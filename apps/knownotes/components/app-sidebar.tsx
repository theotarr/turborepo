"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "@/components/ui/sidebar";
import { UserAccountNav } from "@/components/user-account-nav";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/lib/trpc/react";
import { Course, User } from "@prisma/client";
import { BookOpen, FileText, Search, Settings } from "lucide-react";

import { Icons } from "./icons";
import { ThemeToggle } from "./theme-toggle";

interface AppSidebarProps {
  user: Pick<User, "name" | "image" | "email"> & {
    id: string;
    courses?: Course[];
  };
  recentLectures?: any[];
  recentCourses?: Course[];
}

export function AppSidebar({
  user,
  recentLectures = [],
  recentCourses = [],
}: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const pathname = usePathname();

  const { data: searchResults } = api.lecture.search.useQuery(
    { query: debouncedSearchQuery },
    { enabled: debouncedSearchQuery.length > 0 },
  );

  // Navigation items
  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: FileText,
    },
    {
      title: "Lectures",
      url: "/dashboard/lectures",
      icon: BookOpen,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];

  // Check if a path is active (exact match or starts with for nested routes)
  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") {
      return true;
    }
    return path !== "/dashboard" && pathname.startsWith(path);
  };

  // Check if a lecture is active
  const isLectureActive = (lectureId: string) => {
    return pathname === `/lecture/${lectureId}`;
  };

  // Check if a course is active
  const isCourseActive = (courseId: string) => {
    return pathname === `/course/${courseId}`;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight">KnowNotes</span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Search Input */}
        <SidebarGroup>
          <div className="px-4 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search lectures..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </SidebarGroup>

        {/* Search Results */}
        {searchQuery.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Search Results</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((lecture) => {
                    const active = isLectureActive(lecture.id);
                    return (
                      <SidebarMenuItem key={lecture.id}>
                        <SidebarMenuButton
                          asChild
                          className={
                            active ? "bg-sidebar-accent font-medium" : ""
                          }
                          data-active={active}
                        >
                          <Link
                            href={`/lecture/${lecture.id}`}
                            className="relative"
                          >
                            {active && (
                              <span className="absolute -left-[14px] top-0 h-full w-1 rounded-sm bg-primary" />
                            )}
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{lecture.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No lectures found
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={active ? "bg-sidebar-accent font-medium" : ""}
                      data-active={active}
                    >
                      <Link href={item.url} className="relative">
                        {active && (
                          <span className="absolute left-0 top-0 h-full w-1 rounded-sm bg-primary" />
                        )}
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Lectures */}
        {!searchQuery && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent Lectures</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentLectures.length > 0 ? (
                  recentLectures.slice(0, 5).map((lecture) => {
                    const active = isLectureActive(lecture.id);
                    return (
                      <SidebarMenuItem key={lecture.id}>
                        <SidebarMenuButton
                          asChild
                          className={
                            active ? "bg-sidebar-accent font-medium" : ""
                          }
                          data-active={active}
                        >
                          <Link
                            href={`/lecture/${lecture.id}`}
                            className="relative"
                          >
                            {active && (
                              <span className="absolute -left-[14px] top-0 h-full w-1 rounded-sm bg-primary" />
                            )}
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{lecture.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No recent lectures
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Recent Courses */}
        {!searchQuery && (
          <SidebarGroup>
            <SidebarGroupLabel>Courses</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {user?.courses && user.courses.length > 0 ? (
                  user.courses.slice(0, 5).map((course) => {
                    const active = isCourseActive(course.id);
                    return (
                      <SidebarMenuItem key={course.id}>
                        <SidebarMenuButton
                          asChild
                          className={
                            active ? "bg-sidebar-accent font-medium" : ""
                          }
                          data-active={active}
                        >
                          <Link
                            href={`/course/${course.id}`}
                            className="relative"
                          >
                            {active && (
                              <span className="absolute -left-[14px] top-0 h-full w-1 rounded-sm bg-primary" />
                            )}
                            <BookOpen className="h-4 w-4" />
                            <span className="truncate">{course.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No courses found
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <UserAccountNav user={user} />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
