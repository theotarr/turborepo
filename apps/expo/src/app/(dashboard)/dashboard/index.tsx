import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";
import { router, Stack } from "expo-router";
import Superwall from "@superwall/react-native-superwall";
import { MoveRight, Plus, Settings } from "lucide-react-native";

import type { Lecture } from ".prisma/client";
import { LectureItem } from "~/components/lecture-item";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetOpenTrigger,
  BottomSheetView,
} from "~/components/ui/bottom-sheet";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";
import { shouldShowPaywall } from "~/utils/subscription";

export default function DashboardPage() {
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const lectures = api.lecture.infiniteLectures.useInfiniteQuery(
    {
      limit: 20,
    },
    {
      getNextPageParam: (lastPage: { nextCursor: string }) =>
        lastPage.nextCursor,
    },
  );

  const user = api.auth.getUser.useQuery();
  const createLecture = api.lecture.create.useMutation();

  async function handleCreateLecture() {
    if (isLoading) return;
    setIsLoading(true);

    // Create a new lecture, then forward to the record page.
    try {
      const lecture = await createLecture.mutateAsync({});
      setIsLoading(false);
      router.replace(`/record/${lecture.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create lecture");
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await lectures.refetch();
    setRefreshing(false);
  }

  const handleLoadMore = () => {
    if (lectures.hasNextPage) lectures.fetchNextPage();
  };

  if (!lectures.data?.pages) return null;
  if (!user.data) return null;

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerRight: () => (
            <Pressable
              onPress={() => {
                router.replace("/(dashboard)/settings");
              }}
            >
              <Settings
                size={20}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
            </Pressable>
          ),
        }}
      />

      <View className="h-full w-full px-4 py-6">
        <Text className="mb-4 text-2xl font-semibold tracking-tighter">
          Lectures
        </Text>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 20
            ) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          <View className="divide-y divide-border rounded-md border border-border">
            {lectures.data.pages.map(
              (page: { items: Lecture[]; nextCursor: string }[]) =>
                page.items.map((lecture: Lecture) => (
                  <LectureItem
                    key={lecture.id}
                    lecture={lecture}
                    onLecturePress={() => {
                      // Check if the user has an active Stripe subscription.
                      if (
                        !shouldShowPaywall(
                          user.data as {
                            stripeCurrentPeriodEnd?: string | null;
                            appStoreCurrentPeriodEnd?: string | null;
                          },
                        )
                      ) {
                        router.replace(`/lecture/${lecture.id}`);
                        return;
                      }

                      // If the user doesn't have an active subscription, show the paywall.
                      void Superwall.shared.register("viewLecture").then(() => {
                        router.replace(`/lecture/${lecture.id}`);
                      });
                    }}
                  />
                )),
            )}
          </View>
          {lectures.isFetchingNextPage && (
            <View className="mt-2">
              <ActivityIndicator
                size="small"
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
            </View>
          )}
        </ScrollView>
        <BottomSheet>
          <BottomSheetOpenTrigger asChild>
            <Pressable className="absolute -top-16 right-8 z-10 w-auto rounded-full bg-primary p-4">
              <Plus color={NAV_THEME[colorScheme].background} size={30} />
            </Pressable>
          </BottomSheetOpenTrigger>
          <BottomSheetContent>
            <BottomSheetView className="gap-6">
              <Pressable
                onPress={async () => {
                  if (
                    !shouldShowPaywall(
                      user.data as {
                        stripeCurrentPeriodEnd?: string | null;
                        appStoreCurrentPeriodEnd?: string | null;
                      },
                    )
                  ) {
                    await handleCreateLecture();
                    return;
                  }

                  void Superwall.shared
                    .register("createLecture")
                    .then(async () => {
                      await handleCreateLecture();
                    });
                }}
              >
                <View className="flex flex-row items-center justify-between rounded bg-muted px-4 py-3">
                  <Text className="text-base font-medium text-secondary-foreground/80">
                    Live Lecture
                  </Text>
                  <MoveRight
                    color={NAV_THEME[colorScheme].secondaryForeground}
                    size={16}
                  />
                </View>
              </Pressable>
            </BottomSheetView>
          </BottomSheetContent>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}
