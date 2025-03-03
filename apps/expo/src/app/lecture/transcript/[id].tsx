import React, { useEffect, useRef } from "react";
import { FlatList, Pressable, SafeAreaView, View } from "react-native";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";

interface Transcript {
  text: string;
  start: number;
  embeddingIds?: string[];
}

function TranscriptItem({ transcript }: { transcript: Transcript }) {
  const formattedTime = new Date(transcript.start * 1000)
    .toISOString()
    .substr(11, 8);

  return (
    <View className="mx-2 flex-row gap-x-3 border-b border-border p-3">
      <Text className="mt-0.5 font-mono text-xs text-secondary-foreground">
        {formattedTime}
      </Text>
      <View className="flex-1">
        <Text className="text-sm text-foreground">{transcript.text}</Text>
      </View>
    </View>
  );
}

export default function TranscriptPage() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const scrollViewRef = useRef<FlatList>(null);
  const { id } = useGlobalSearchParams();

  if (!id || typeof id !== "string") throw new Error("Lecture ID is required");

  const { data: lecture, isLoading } = api.lecture.byId.useQuery({ id });

  // Using the transcript directly from the lecture object
  const transcript = lecture?.transcript as Transcript[] | undefined;
  const isTranscriptLoading = isLoading;

  // Automatically scroll to bottom when new transcript items appear
  useEffect(() => {
    if (transcript?.length && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [transcript]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <ChevronLeft
                className="m-0 p-0"
                color={NAV_THEME[colorScheme].secondaryForeground}
                size={20}
              />
            </Pressable>
          ),
          headerTitle: `Transcript`,
        }}
      />
      {isLoading || isTranscriptLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground">Loading transcript...</Text>
        </View>
      ) : !transcript || transcript.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="mb-2 text-center text-foreground">
            No transcript available for this lecture.
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            The transcript may still be processing or wasn't generated for this
            lecture.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={transcript}
          keyExtractor={(_, index) => `transcript-item-${index}`}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          renderItem={({ item }) => <TranscriptItem transcript={item} />}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
