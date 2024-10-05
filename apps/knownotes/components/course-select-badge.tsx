import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/ui/select";
import { SelectTrigger } from "@radix-ui/react-select";

import { Badge } from "./ui/badge";

interface CourseSelectBadgeProps {
  courses: {
    id: string;
    name: string;
  }[];
  selectedCourseId?: string;
  onSelect: (courseId: string) => void;
}

export const CourseSelectBadge = ({
  courses,
  selectedCourseId,
  onSelect,
}: CourseSelectBadgeProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Select
      open={open}
      onOpenChange={(open) => setOpen(open)}
      onValueChange={(value) => onSelect(value)}
      defaultValue={selectedCourseId ?? undefined}
    >
      <SelectTrigger className="m-0 p-0 outline-none ring-0 focus:outline-none">
        <Badge>
          <SelectValue placeholder="No course selected...">
            {courses.find((c) => c.id === selectedCourseId)?.name ??
              "No course selected..."}
          </SelectValue>
        </Badge>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Course</SelectLabel>
          {courses.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
