import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, View } from "react-native";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { FlashcardDeck } from "~/components/flashcard";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";

export default function Lecture() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");
  const { data: lecture } = api.lecture.byId.useQuery({ id });

  const createFlashcardsMutation = api.lecture.createFlashcards.useMutation();
  const [flashcards, setFlashcards] = useState<
    {
      front: string;
      back: string;
    }[]
  >([]);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);

  useEffect(() => {
    if (!lecture) return;
    if (flashcards.length > 0) return;
    if (lecture.flashcards.length > 0) {
      setFlashcards(
        lecture.flashcards.map((card) => ({
          front: card.term,
          back: card.definition,
        })),
      );
      return;
    }

    async function createFlashcards() {
      const cards = await createFlashcardsMutation.mutateAsync({
        lectureId: lecture?.id,
      });
      setFlashcards(
        cards.map((card) => ({ front: card.term, back: card.definition })),
      );
    }

    // Generate flashcards.
    setIsLoadingFlashcards(true);
    createFlashcards().then(() => {
      setIsLoadingFlashcards(false);
    });
  }, [lecture]);

  if (!lecture) return null;

  return (
    <SafeAreaView className="w-full flex-1 bg-background">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Button
              variant="link"
              onPress={() => {
                router.replace(`/lecture/${id}`);
              }}
            >
              <ChevronLeft
                className="m-0 p-0"
                color={NAV_THEME[colorScheme].secondaryForeground}
                size={20}
              />
            </Button>
          ),
          headerTitle: "Flashcards",
        }}
      />

      <View className="flex-1 items-center justify-center">
        {isLoadingFlashcards && flashcards.length === 0 ? (
          <View className="flex flex-col gap-4">
            <ActivityIndicator
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text className="text-lg font-medium text-muted-foreground">
              Generating flashcards...
            </Text>
          </View>
        ) : (
          <FlashcardDeck cards={flashcards} />
        )}
      </View>
    </SafeAreaView>
  );
}
