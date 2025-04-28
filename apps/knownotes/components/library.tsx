"use client";

import { useState } from "react";
import { ChatItem } from "@/components/chat-item";
import { LectureItem } from "@/components/lecture-item";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Course, Prisma } from "@acme/db";

type LectureWithCourseName = Prisma.LectureGetPayload<{
  select: {
    id: true;
    title: true;
    type: true;
    fileId: true;
    createdAt: true;
    updatedAt: true;
    userId: true;
    courseId: true;
    course: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

type ChatWithCourse = Prisma.ChatGetPayload<{
  include: { course: true };
}>;

interface LibraryProps {
  lectures: LectureWithCourseName[];
  chats: ChatWithCourse[];
  courses: Course[]; // Use the base Course type fetched in page.tsx
  defaultTab: "notes" | "chats";
}

export function Library({
  lectures,
  chats,
  courses, // Pass courses if LectureItem/ChatItem needs them directly
  defaultTab,
}: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Filter logic
  const filteredLectures = lectures.filter((lecture) => {
    const searchMatch =
      lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lecture.course &&
        lecture.course.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const courseMatch =
      !selectedCourseId || lecture.courseId === selectedCourseId;

    return searchMatch && courseMatch;
  });

  const filteredChats = chats.filter((chat) => {
    const searchMatch =
      (chat.name || `Chat ${chat.id}`)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (chat.course &&
        chat.course.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const courseMatch = !selectedCourseId || chat.courseId === selectedCourseId;

    return searchMatch && courseMatch;
  });

  return (
    <Tabs defaultValue={defaultTab} className="mb-8">
      <TabsList className="mb-4">
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="chats">Chats</TabsTrigger>
      </TabsList>

      {/* Search Input */}
      <div className="mb-6 flex flex-col gap-2 md:flex-row">
        <Input
          type="search"
          placeholder="Search by title or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 lg:w-1/3"
        />
        <Select
          value={selectedCourseId}
          onValueChange={(value) => setSelectedCourseId(value || "")}
        >
          <SelectTrigger className="w-[125px]">
            <SelectValue placeholder="Filter by course..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabsContent value="notes">
        <div className="overflow-hidden rounded-lg border">
          {filteredLectures.length > 0 ? (
            filteredLectures.map((lecture) => (
              <LectureItem
                key={lecture.id}
                lecture={lecture}
                courses={courses}
              />
            ))
          ) : (
            <div className="flex min-h-[200px] items-center justify-center p-4 text-center text-muted-foreground">
              {searchTerm
                ? `No notes found for "${searchTerm}".`
                : "No notes found. Create a new note to get started."}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="chats">
        <div className="overflow-hidden rounded-lg border">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => <ChatItem key={chat.id} chat={chat} />)
          ) : (
            <div className="flex min-h-[200px] items-center justify-center p-4 text-center text-muted-foreground">
              {searchTerm
                ? `No chats found for "${searchTerm}".`
                : "No chats found. Start a new chat to get started."}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
