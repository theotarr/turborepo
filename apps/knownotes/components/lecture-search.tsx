"use client";

import * as React from "react";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icons } from "@/components/icons";
import { LectureItem } from "@/components/lecture-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { Course } from "@prisma/client";
import { debounce } from "lodash";

interface LectureSearchProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string;
  courses?: Course[];
}

export function LectureSearch({
  className,
  placeholder = "Search your lectures...",
  courses,
  ...props
}: LectureSearchProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams?.get("q") || "");
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(
    undefined,
  );

  // Debounce search input to prevent excessive API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setQuery(value);
    }, 250),
    [],
  );

  // Use the tRPC query with courseId filter
  const {
    data: lectures,
    isLoading,
    error,
  } = api.lecture.search.useQuery({
    query,
    courseId: selectedCourseId,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery("");
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId === "all" ? undefined : courseId);
  };

  // Determine what to show based on query and results
  const hasValidQuery = query.length >= 2 || selectedCourseId;
  const searchResults = lectures || [];

  return (
    <div className={cn("w-full", className)} {...props}>
      <div className="mb-2 flex gap-2">
        {/* Course filter dropdown */}
        <div className="w-[160px] shrink-0">
          <Select defaultValue="all" onValueChange={handleCourseChange}>
            <SelectTrigger>
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses?.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            className="w-full"
            defaultValue={query}
            onChange={handleSearchChange}
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <Icons.close className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading && hasValidQuery && (
        <div className="flex justify-center py-4 duration-300 animate-in fade-in">
          <Icons.spinner className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && error && (
        <div className="text-center text-sm text-destructive duration-300 animate-in fade-in">
          An error occurred while searching...
        </div>
      )}

      {!isLoading && !searchResults.length && (
        <div className="text-center text-sm text-muted-foreground duration-300 animate-in fade-in">
          No lectures found matching your search.
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="divide-y divide-border rounded-md border duration-300 animate-in fade-in">
          {searchResults.map((lecture) => (
            <LectureItem key={lecture.id} lecture={lecture} courses={courses} />
          ))}
        </div>
      )}
    </div>
  );
}
