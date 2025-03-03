import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Share,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import {
  Captions,
  GalleryVerticalEnd,
  Share2,
  Sparkles,
} from "lucide-react-native";

import { LectureHeader } from "~/components/lecture-header";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";
import { getBaseUrl } from "~/utils/base-url";

export default function Lecture() {
  const utils = api.useUtils();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("Lecture ID is required");

  const { data: lecture } = api.lecture.byId.useQuery({ id });
  const { data: courses } = api.course.list.useQuery();
  const generateNotes = api.lecture.generateNotes.useMutation();

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
        <LectureHeader
          lecture={
            lecture as {
              id: string;
              title: string;
              type: "YOUTUBE" | "AUDIO" | "LIVE";
              courseId?: string;
              course?: {
                name: string;
              };
              createdAt: Date;
            }
          }
          courses={
            courses as {
              id: string;
              name: string;
            }[]
          }
        />
        <ScrollView className="mt-6 max-h-16" horizontal={true}>
          <Button
            variant="secondary"
            className="mr-2 flex flex-row gap-2 rounded-full"
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
            className="mr-2 flex flex-row gap-2 rounded-full"
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
            className="mr-2 flex flex-row gap-2 rounded-full"
            onPress={() => router.push(`/lecture/quiz/${lecture.id}`)}
          >
            <Sparkles
              size={16}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text>Quiz</Text>
          </Button>
          <Button
            variant="secondary"
            className="mr-2 flex flex-row gap-2 rounded-full"
            onPress={() => router.push(`/lecture/transcript/${lecture.id}`)}
          >
            <Captions
              size={16}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text>Transcript</Text>
          </Button>
          <Button
            variant="secondary"
            className="flex flex-row gap-2 rounded-full"
            onPress={async () => {
              await Share.share({
                message: `Hey check out my notes on ${lecture.title}`,
                url: `https://knownotes.ai/share/${lecture.id}?ref=ios`,
              });
            }}
          >
            <Share2
              size={16}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text>Share</Text>
          </Button>
        </ScrollView>
        {lecture.enhancedNotes || lecture.markdownNotes ? (
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
        ) : (
          <View className="w-full flex-1 items-center justify-end pb-8">
            <Button
              variant="default"
              size="lg"
              className="flex w-full flex-row items-center gap-x-2 rounded-full"
              onPress={async () => {
                await generateNotes.mutateAsync({ lectureId: lecture.id });
                await utils.lecture.byId.invalidate({ id: lecture.id });
              }}
              disabled={generateNotes.isPending}
            >
              {generateNotes.isPending ? (
                <ActivityIndicator
                  size="small"
                  color={NAV_THEME[colorScheme].primaryForeground}
                />
              ) : (
                <Sparkles
                  size={20}
                  color={NAV_THEME[colorScheme].primaryForeground}
                />
              )}
              <Text className="text-lg font-medium text-primary-foreground">
                Generate Notes
              </Text>
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
