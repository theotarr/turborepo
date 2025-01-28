import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";
import appsFlyer from "react-native-appsflyer";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import Superwall from "@superwall/react-native-superwall";
import {
  File,
  Mic,
  MoveRight,
  Plus,
  Settings,
  Youtube,
} from "lucide-react-native";

import type { Lecture } from ".prisma/client";
import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { LectureItem } from "~/components/lecture-item";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDismissButton,
  BottomSheetOpenTrigger,
  BottomSheetView,
} from "~/components/ui/bottom-sheet";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";
import { shouldShowPaywall } from "~/utils/subscription";

export default function DashboardPage() {
  const utils = api.useUtils();
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [courseFilter, setCourseFilter] = useState<{
    courseId: string;
    name: string;
  } | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const user = api.auth.getUser.useQuery();
  const lectures = api.lecture.infiniteLectures.useInfiniteQuery(
    {
      limit: 20,
      courseId: courseFilter?.courseId ?? undefined,
    },
    {
      getNextPageParam: (lastPage: { nextCursor: string | undefined }) =>
        lastPage.nextCursor ?? undefined,
    },
  );

  const filteredLectures = lectures.data
    ? lectures.data.pages[0]?.items.filter(
        (lecture) =>
          !courseFilter || lecture.courseId === courseFilter.courseId,
      )
    : [];

  const createLecture = api.lecture.create.useMutation();

  const createYoutubeLecture = api.lecture.createYoutube.useMutation();
  const createCourse = api.course.create.useMutation();

  async function handleCreateLecture(type: "live" | "audio" | "youtube") {
    if (isLoading) return;
    setIsLoading(true);

    // Create a new lecture, then forward to the record page.
    try {
      if (type === "live") {
        const lecture = await createLecture.mutateAsync({});
        router.push(`/record/${lecture.id}`);
      } else if (type === "youtube") {
        const lecture = (await createYoutubeLecture.mutateAsync({
          videoUrl,
        })) as { id: string };
        router.push(`/lecture/${lecture.id}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create lecture");
    } finally {
      setIsLoading(false);
      setIsYoutubeDialogOpen(false);
      setVideoUrl("");
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await lectures.refetch();
    setRefreshing(false);
  }

  const handleLoadMore = () => {
    if (lectures.hasNextPage) void lectures.fetchNextPage();
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*", // You can specify the file types you want to allow
      copyToCacheDirectory: true,
    });

    if (result.type === "success") {
      setFile(result);
    }
  };

  if (
    lectures.data === undefined ||
    lectures.data.pages.length === 0 ||
    !user.data
  )
    return (
      <Stack.Screen
        options={{
          headerLeft: () => <></>,
          title: "Dashboard",
          headerRight: () => (
            <Pressable onPress={() => router.push("/(dashboard)/settings")}>
              <Settings
                size={20}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
            </Pressable>
          ),
        }}
      />
    );

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerRight: () => (
            <Pressable onPress={() => router.push("/(dashboard)/settings")}>
              <Settings
                size={20}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
            </Pressable>
          ),
        }}
      />
      <View className="h-full w-full px-4 py-6">
        <View className="h-full w-full">
          <Text className="text-2xl font-semibold tracking-tighter">
            Lectures
          </Text>
          <View className="mb-4 mt-4 flex-row items-center gap-x-2">
            <Button
              size="sm"
              className="rounded-full"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCourseFilter(null);
              }}
            >
              <Text>{courseFilter ? courseFilter.name : "All lectures"}</Text>
            </Button>
            <Dialog
              open={isCourseDialogOpen}
              onOpenChange={setIsCourseDialogOpen}
            >
              <BottomSheet>
                {user.data.courses.length === 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    onPress={() => setIsCourseDialogOpen(true)}
                  >
                    <Text>Add course</Text>
                  </Button>
                ) : (
                  <BottomSheetOpenTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      onPress={() => {
                        void Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Medium,
                        );
                      }}
                    >
                      <Text>View courses</Text>
                    </Button>
                  </BottomSheetOpenTrigger>
                )}
                <BottomSheetContent>
                  <BottomSheetView className="gap-6 px-6">
                    <Text className="text-2xl font-semibold text-secondary-foreground">
                      Courses
                    </Text>
                    <ScrollView className="max-h-[400px]">
                      {user.data.courses.map((course) => (
                        <BottomSheetDismissButton
                          key={course.id}
                          variant="outline"
                          className="mb-2 w-full flex-row items-center justify-between rounded-lg"
                          onPress={() =>
                            setCourseFilter({
                              courseId: course.id,
                              name: course.name,
                            })
                          }
                        >
                          <Text className="font-medium text-secondary-foreground">
                            {course.name}
                          </Text>
                          <Text className="font-base text-sm text-muted-foreground">
                            {course._count.lectures > 1
                              ? `${course._count.lectures} lectures`
                              : course._count.lectures === 0
                                ? "No lectures"
                                : "1 lecture"}
                          </Text>
                        </BottomSheetDismissButton>
                      ))}
                    </ScrollView>
                    <BottomSheetDismissButton
                      onPress={() => setIsCourseDialogOpen(true)}
                      className="w-full"
                    >
                      <Text>New Course</Text>
                    </BottomSheetDismissButton>
                  </BottomSheetView>
                </BottomSheetContent>
              </BottomSheet>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Course</DialogTitle>
                  <DialogDescription>
                    Add a new course to organize your lectures.
                  </DialogDescription>
                </DialogHeader>
                <View className="gap-4">
                  <View>
                    <Text className="mb-2 text-sm font-medium">Name</Text>
                    <Input
                      value={courseName}
                      onChangeText={setCourseName}
                      placeholder="E.g. CS50"
                    />
                  </View>
                  <Button
                    onPress={async () => {
                      const course = await createCourse.mutateAsync({
                        name: courseName,
                      });
                      await utils.auth.getUser.invalidate();
                      setCourseFilter({
                        courseId: course.id,
                        name: course.name,
                      });
                      setCourseName("");
                      setIsCourseDialogOpen(false);
                    }}
                    className="w-full flex-row items-center gap-x-2"
                    disabled={createCourse.isPending}
                  >
                    {createCourse.isPending && (
                      <ActivityIndicator
                        size="small"
                        color={NAV_THEME[colorScheme].primaryForeground}
                      />
                    )}
                    <Text>Create</Text>
                  </Button>
                </View>
              </DialogContent>
            </Dialog>
          </View>
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
              )
                handleLoadMore();
            }}
            scrollEventThrottle={400}
          >
            {filteredLectures?.length === 0 && !lectures.isFetching && (
              <EmptyPlaceholder>
                <EmptyPlaceholder.Icon icon={Plus} size={24} />
                <EmptyPlaceholder.Title>
                  {courseFilter ? "This course is empty" : "No lectures yet"}
                </EmptyPlaceholder.Title>
                <EmptyPlaceholder.Description className="max-w-[280px]">
                  Create a new lecture by clicking the plus button below.
                </EmptyPlaceholder.Description>
              </EmptyPlaceholder>
            )}
            {lectures.data.pages[0].items.length > 0 && (
              <View className="flex-col gap-y-2">
                {lectures.data.pages.map(
                  (page: { items: Lecture[]; nextCursor: string }[]) =>
                    page.items.map((lecture) => {
                      if (
                        courseFilter &&
                        lecture.courseId !== courseFilter.courseId
                      )
                        return null;
                      return (
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
                              router.push(`/lecture/${lecture.id}`);
                              return;
                            }

                            // If the user doesn't have an active subscription, show the paywall.
                            void Superwall.shared
                              .register("viewLecture")
                              .then(() =>
                                router.push(`/lecture/${lecture.id}`),
                              );
                          }}
                        />
                      );
                    }),
                )}
              </View>
            )}
            {lectures.isFetchingNextPage && (
              <View className="mt-2">
                <ActivityIndicator
                  size="small"
                  color={NAV_THEME[colorScheme].secondaryForeground}
                />
              </View>
            )}
          </ScrollView>
        </View>
        <BottomSheet>
          <BottomSheetOpenTrigger asChild>
            <Pressable
              className="absolute -top-16 right-8 z-10 w-auto rounded-full bg-primary p-4"
              onPress={async () => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await appsFlyer.logEvent("open_lecture_create", {});
              }}
            >
              <Plus color={NAV_THEME[colorScheme].background} size={30} />
            </Pressable>
          </BottomSheetOpenTrigger>
          <BottomSheetContent>
            <BottomSheetView className="gap-4 px-6">
              <Text className="text-2xl font-semibold text-secondary-foreground">
                New Lecture
              </Text>
              <BottomSheetDismissButton
                size="lg"
                variant="secondary"
                className="w-full flex-row items-center justify-between px-4"
                onPress={async () => {
                  if (
                    !shouldShowPaywall(
                      user.data as {
                        stripeCurrentPeriodEnd?: string | null;
                        appStoreCurrentPeriodEnd?: string | null;
                      },
                    )
                  ) {
                    await handleCreateLecture("live");
                    return;
                  }

                  void Superwall.shared
                    .register("createLecture")
                    .then(async () => {
                      await handleCreateLecture("live");
                    });
                }}
              >
                <View className="flex-row items-center gap-x-4">
                  <Mic
                    size={20}
                    color={NAV_THEME[colorScheme].secondaryForeground}
                  />
                  <Text>Record Audio</Text>
                </View>
                <MoveRight
                  color={NAV_THEME[colorScheme].secondaryForeground}
                  size={20}
                />
              </BottomSheetDismissButton>
              <BottomSheetDismissButton
                size="lg"
                variant="secondary"
                className="w-full flex-row items-center justify-between px-4"
                onPress={() => setIsYoutubeDialogOpen(true)}
              >
                <View className="flex-row items-center gap-x-4">
                  <Youtube
                    size={20}
                    color={NAV_THEME[colorScheme].secondaryForeground}
                  />
                  <Text>Youtube video</Text>
                </View>
                <MoveRight
                  color={NAV_THEME[colorScheme].secondaryForeground}
                  size={20}
                />
              </BottomSheetDismissButton>
              {/* <BottomSheetDismissButton
                size="lg"
                variant="secondary"
                className="w-full flex-row items-center justify-between px-4"
                onPress={pickDocument}
              >
                <View className="flex-row items-center gap-x-4">
                  <File
                    size={20}
                    color={NAV_THEME[colorScheme].secondaryForeground}
                  />
                  <Text>Upload File</Text>
                </View>
                <MoveRight
                  color={NAV_THEME[colorScheme].secondaryForeground}
                  size={20}
                />
              </BottomSheetDismissButton> */}
            </BottomSheetView>
          </BottomSheetContent>
        </BottomSheet>
      </View>
      <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Youtube Lecture</DialogTitle>
            <DialogDescription>
              Enter a Youtube video URL to create a lecture from it.
            </DialogDescription>
          </DialogHeader>
          <View className="gap-4">
            <View>
              <Text className="mb-2 text-sm font-medium">Youtube URL</Text>
              <Input
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://youtube.com/watch?v=..."
              />
            </View>
            <Button
              onPress={async () => {
                if (
                  !shouldShowPaywall(
                    user.data as {
                      stripeCurrentPeriodEnd?: string | null;
                      appStoreCurrentPeriodEnd?: string | null;
                    },
                  )
                ) {
                  await handleCreateLecture("youtube");
                  return;
                }

                void Superwall.shared
                  .register("createLecture")
                  .then(async () => {
                    await handleCreateLecture("youtube");
                  });
              }}
              className="w-full flex-row items-center gap-x-2"
              disabled={isLoading}
            >
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color={NAV_THEME[colorScheme].primaryForeground}
                />
              )}
              <Text>Create</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </SafeAreaView>
  );
}
