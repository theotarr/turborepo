import type { Course, Lecture } from "@prisma/client";
import React from "react";
import { View } from "react-native";

import { Text } from "~/components/ui/text";
import { formatLectureType, formatShortDate } from "~/lib/utils";
import { Badge } from "./ui/badge";

interface LectureItemProps {
  lecture: Lecture & {
    course?: Course | null;
  };
  onLecturePress?: () => void;
}

export function LectureItem({ lecture, onLecturePress }: LectureItemProps) {
  return (
    <View className="group flex w-full flex-row items-center justify-between p-4 hover:bg-muted/50">
      <View className="grid gap-1">
        <Text
          onPress={onLecturePress}
          className="line-clamp-1 truncate font-semibold hover:underline"
        >
          {lecture.title}
        </Text>
        <View className="flex flex-row space-x-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            <Text>{formatLectureType(lecture.type)}</Text>
          </Badge>
          {lecture.course && (
            <Badge variant="outline">
              <Text>{lecture.course.name}</Text>
            </Badge>
          )}
        </View>
      </View>
      <View className="flex flex-row items-center space-x-4">
        <Text className="text-xs text-muted-foreground">
          {formatShortDate(lecture.updatedAt.toDateString())}
        </Text>
      </View>
    </View>
  );
}
