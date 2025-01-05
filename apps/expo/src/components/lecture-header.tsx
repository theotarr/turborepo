import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import {
  LectureOperations,
  useEditLectureDialogStore,
} from "~/components/lecture-operations";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { formatShortDate } from "~/lib/utils";

interface LectureHeaderProps {
  lecture: {
    id: string;
    title: string;
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
}

export function LectureHeader({
  lecture,
  courses,
  showBackButton = true,
}: LectureHeaderProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { setOpen } = useEditLectureDialogStore();

  return (
    <View className="flex w-full flex-row items-center justify-between">
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
          <Text className="text-2xl font-semibold tracking-tight">
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
            <Badge variant="outline">
              <Text>{formatShortDate(lecture.createdAt.getTime())}</Text>
            </Badge>
          </View>
        </View>
      </View>
      <View>
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
