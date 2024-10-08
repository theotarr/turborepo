import type { Course, Lecture } from "@prisma/client";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";

import { Text } from "~/components/ui/text";
// import { LectureOperations } from "~/components/lecture-operations";
import { formatLectureType, formatShortDate } from "~/lib/utils";
import { Badge } from "./ui/badge";

interface LectureItemProps {
  lecture: Lecture & {
    course?: Course;
  };
  courses?: Course[];
}

export function LectureItem({ lecture, courses }: LectureItemProps) {
  const router = useRouter();

  return (
    <View className="group flex w-full flex-row items-center justify-between p-4 hover:bg-muted/50">
      <View className="grid gap-1">
        <Text
          onPress={() => router.replace(`/lecture/${lecture.id}`)}
          className="line-clamp-1 truncate font-semibold hover:underline"
        >
          {lecture.title}
        </Text>
        <View className="flex flex-row space-x-2 text-sm text-muted-foreground">
          {lecture.type && (
            <Badge variant="secondary">
              <Text>{formatLectureType(lecture.type)}</Text>
            </Badge>
          )}
          {lecture.course && (
            <Link href={`/lecture/${lecture.course.id}`}>
              <Badge variant="outline">
                <Text>{lecture.course.name}</Text>
              </Badge>
            </Link>
          )}
        </View>
      </View>
      <View className="flex flex-row items-center space-x-4">
        <Text className="text-xs text-muted-foreground">
          {formatShortDate(lecture.updatedAt.toDateString())}
        </Text>
        {/* <LectureOperations lecture={lecture as any} courses={courses} /> */}
      </View>
    </View>
  );
}
