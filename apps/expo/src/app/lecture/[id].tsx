import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { WebView } from "react-native-webview";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  EllipsisVertical,
  GalleryVerticalEnd,
  Sparkles,
} from "lucide-react-native";

import { LectureOperations } from "~/components/lecture-operations";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { formatShortDate } from "~/lib/utils";
import { api } from "~/utils/api";
import { getBaseUrl } from "~/utils/base-url";

export default function Lecture() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");
  const { data: lecture } = api.lecture.byId.useQuery({ id });
  const { data: courses } = api.course.list.useQuery();

  if (!lecture || !courses)
    return (
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
    );

  return (
    <SafeAreaView className="relative flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex-1 p-4">
        <View className="flex w-full flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-4">
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
            <View>
              <Text className="text-2xl font-semibold tracking-tight">
                {lecture.title}
              </Text>
              <View className="mt-1 flex flex-row gap-2">
                <Badge>
                  <Text>
                    {lecture.type.substring(0, 1) +
                      lecture.type.toLowerCase().substring(1)}
                  </Text>
                </Badge>
                {lecture.course && (
                  <Badge>
                    <Text>{lecture.course.name}</Text>
                  </Badge>
                )}
                <Badge variant="secondary">
                  <Text>{formatShortDate(lecture.createdAt.getTime())}</Text>
                </Badge>
              </View>
            </View>
          </View>
          <View>
            <LectureOperations
              lecture={
                lecture as {
                  id: string;
                  title: string;
                  courseId?: string;
                }
              }
              courses={courses as { id: string; name: string }[]}
            />
          </View>
        </View>
        <View className="mt-6 flex flex-row flex-wrap gap-4">
          <Button
            variant="secondary"
            className="flex flex-row gap-2 rounded-full"
            onPress={() => router.push(`/lecture/chat/${lecture.id}`)}
          >
            <Sparkles
              size={16}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text>Chat</Text>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-row gap-2 rounded-full"
            onPress={() => router.push(`/lecture/flashcard/${lecture.id}`)}
          >
            <GalleryVerticalEnd
              size={16}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text>Flashcards</Text>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-row gap-2 rounded-full"
            onPress={() => alert("Not implemented")}
          >
            <GalleryVerticalEnd
              size={16}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text>Quiz</Text>
          </Button>
        </View>
        <WebView
          originWhitelist={["*"]}
          style={{ backgroundColor: "transparent", marginTop: 8 }}
          source={{
            uri: `${getBaseUrl()}/native-notes/lecture/${lecture.id}?theme=${colorScheme}`,
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <View className="flex flex-col items-center gap-2">
                <ActivityIndicator
                  color={NAV_THEME[colorScheme].secondaryForeground}
                  size="small"
                />
                <Text className="text-sm text-muted-foreground">
                  Loading notes...
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
