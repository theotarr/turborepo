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
import { Course, Lecture } from "@prisma/client";
import { debounce } from "lodash";

interface LectureSearchProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string;
  courses?: Course[];
  defaultLectures?: (Lecture & { course?: Course | null })[];
}

export function LectureSearch({
  className,
  placeholder = "Search your lectures...",
  courses,
  defaultLectures = [],
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
    }, 300),
    [],
  );

  // Use the tRPC query with courseId filter
  const {
    data: lectures,
    isLoading,
    error,
  } = api.lecture.search.useQuery(
    {
      query,
      courseId: selectedCourseId,
    },
    {
      enabled: query.length >= 2,
      keepPreviousData: true,
    },
  );

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
  const hasValidQuery = query.length >= 2;
  const showSearchResults = hasValidQuery && !isLoading;
  const searchResults = lectures || [];

  // If we have a valid query but no search results yet, or no query at all, show default lectures
  // Filter default lectures by course if a course is selected
  const showDefaultLectures =
    !hasValidQuery || (hasValidQuery && !searchResults.length && isLoading);
  const filteredDefaultLectures = showDefaultLectures
    ? defaultLectures?.filter(
        (lecture) => !selectedCourseId || lecture.courseId === selectedCourseId,
      )
    : [];

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      <div className="flex gap-2">
        {/* Course filter dropdown */}
        <div className="w-[180px] shrink-0">
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
        <div className="flex justify-center py-4">
          <Icons.spinner className="h-6 w-6 animate-spin" />
        </div>
      )}

      {error && (
        <div className="mt-4 text-center text-sm text-destructive">
          An error occurred while searching...
        </div>
      )}

      {showSearchResults && searchResults.length === 0 && (
        <div className="pt-4 text-center text-sm text-muted-foreground">
          No lectures found matching your search.
        </div>
      )}

      {showSearchResults && searchResults.length > 0 && (
        <div className="divide-y divide-border rounded-md border">
          {searchResults.map((lecture) => (
            <LectureItem key={lecture.id} lecture={lecture} courses={courses} />
          ))}
        </div>
      )}

      {/* Show default lectures when not searching or when search is in progress */}
      {showDefaultLectures &&
        filteredDefaultLectures &&
        filteredDefaultLectures.length > 0 && (
          <div className="divide-y divide-border rounded-md border">
            {filteredDefaultLectures.map((lecture) => (
              <LectureItem
                key={lecture.id}
                lecture={lecture}
                courses={courses}
              />
            ))}
          </div>
        )}

      {showDefaultLectures &&
        selectedCourseId &&
        filteredDefaultLectures?.length === 0 && (
          <div className="pt-4 text-center text-sm text-muted-foreground">
            No lectures in this course. Try selecting a different course or add
            lectures to this one.
          </div>
        )}
    </div>
  );
}
