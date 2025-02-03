import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Aperture, ChevronLeft } from "lucide-react-native";

import {
  LectureOperations,
  useEditLectureDialogStore,
} from "~/components/lecture-operations";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { cn, formatShortDate } from "~/lib/utils";

interface LectureHeaderProps {
  lecture: {
    id: string;
    title: string;
    type: "YOUTUBE" | "AUDIO" | "LIVE";
    courseId?: string;
    course?: {
      name: string;
    };
    createdAt: Date;
  };
  courses: {
    id: string;
    name: string;
  }[];
  showBackButton?: boolean;
  className?: string;
}

export function LectureHeader({
  lecture,
  courses,
  showBackButton = true,
  className,
}: LectureHeaderProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { setOpen } = useEditLectureDialogStore();

  return (
    <View
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      <View className="flex-row items-center gap-x-4">
        {showBackButton && (
          <Button
            variant="link"
            className="size-6"
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(dashboard)/dashboard")
            }
          >
            <ChevronLeft
              className="m-0 p-0"
              color={NAV_THEME[colorScheme].secondaryForeground}
              size={20}
            />
          </Button>
        )}
        <View className={showBackButton ? "" : "ml-4"}>
          <Text className="line-clamp-1 max-w-[280px] truncate text-2xl font-semibold tracking-tight">
            {lecture.title}
          </Text>
          <View className="mt-1 flex flex-row gap-x-2">
            {lecture.course ? (
              <Badge>
                <Text>{lecture.course.name}</Text>
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Pressable className="w-full" onPress={() => setOpen(true)}>
                  <Text>Add to course</Text>
                </Pressable>
              </Badge>
            )}
            {lecture.type === "YOUTUBE" && (
              <Badge variant="secondary">
                <Text>Youtube</Text>
              </Badge>
            )}
            <Badge variant="outline">
              <Text>{formatShortDate(lecture.createdAt.getTime())}</Text>
            </Badge>
          </View>
        </View>
      </View>
      <View className="absolute right-0">
        <LectureOperations
          lecture={{
            id: lecture.id,
            title: lecture.title,
            courseId: lecture.courseId,
          }}
          courses={courses}
        />
      </View>
    </View>
  );
}
