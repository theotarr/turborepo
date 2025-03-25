import React from "react";
import { Pressable, View } from "react-native";

import { LectureOperations } from "~/components/lecture-operations";
import { Text } from "~/components/ui/text";
import { formatLectureType, formatShortDate } from "~/lib/utils";
import { Badge } from "./ui/badge";

interface LectureItemProps {
  lecture: {
    id: string;
    title: string;
    type: string;
    updatedAt: Date;
    courseId?: string | null;
  } & {
    course?: {
      id: string;
      name: string;
    };
  };
  onLecturePress?: () => void;
}

export function LectureItem({ lecture, onLecturePress }: LectureItemProps) {
  return (
    <Pressable
      onPress={onLecturePress}
      className="group flex w-full flex-row items-center justify-between rounded-xl border border-border p-4"
    >
      <View className="mr-2 grid flex-1 gap-1">
        <Text
          className="line-clamp-1 truncate font-semibold hover:underline"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {lecture.title}
        </Text>
        <View className="flex flex-row flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <Badge variant="secondary">
            <Text>{formatLectureType(lecture.type)}</Text>
          </Badge>
          {lecture.course && (
            <Badge variant="outline">
              <Text>{lecture.course.name}</Text>
            </Badge>
          )}
          <Badge variant="outline" className="flex-row items-center gap-x-1">
            <Text>{formatShortDate(lecture.updatedAt.toDateString())}</Text>
          </Badge>
        </View>
      </View>
      <LectureOperations
        lecture={{
          id: lecture.id,
          title: lecture.title,
          courseId: lecture.courseId ?? undefined,
        }}
        courses={lecture.course ? [lecture.course] : undefined}
      />
    </Pressable>
  );
}
