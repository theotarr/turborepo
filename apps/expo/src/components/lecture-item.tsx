import React from "react";
import { Pressable, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { formatLectureType, formatShortDate } from "~/lib/utils";
import { Badge } from "./ui/badge";

interface LectureItemProps {
  lecture: {
    id: string;
    title: string;
    type: string;
    updatedAt: Date;
    courseId: string;
  } & {
    course?: {
      id: string;
      name: string;
    };
  };
  onLecturePress?: () => void;
}

export function LectureItem({ lecture, onLecturePress }: LectureItemProps) {
  const { colorScheme } = useColorScheme();

  return (
    <Pressable
      onPress={onLecturePress}
      className="group flex w-full flex-row items-center justify-between rounded-xl border border-border p-4"
    >
      <View className="grid gap-1">
        <Text className="line-clamp-1 truncate font-semibold hover:underline">
          {lecture.title}
        </Text>
        <View className="flex flex-row gap-x-2 text-sm text-muted-foreground">
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
      <View className="flex flex-row items-center gap-x-4">
        <Text className="text-xs text-muted-foreground">
          {formatShortDate(lecture.updatedAt.toDateString())}
        </Text>
        <ChevronRight
          size={16}
          color={NAV_THEME[colorScheme].mutedForeground}
        />
      </View>
    </Pressable>
  );
}
