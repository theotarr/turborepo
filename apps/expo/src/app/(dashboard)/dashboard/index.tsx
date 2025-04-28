import "react-native-get-random-values";

import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";
import appsFlyer from "react-native-appsflyer";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
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
  Zap,
} from "lucide-react-native";
import * as Tus from "tus-js-client";
import { v1 as uuidv1 } from "uuid";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { LectureItem } from "~/components/lecture-item";
import { MicrophonePermission } from "~/components/mic-permissions";
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

// Define a custom FileSource interface for tus-js-client
interface ReactNativeFileSource {
  uri: string;
  name?: string;
  type?: string;
  size?: number;
}

export default function DashboardPage() {
  const utils = api.useUtils();
  const { colorScheme } = useColorScheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isPickingFile, setIsPickingFile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [courseFilter, setCourseFilter] = useState<{
    courseId: string;
    name: string;
  } | null>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadRef = useRef<Tus.Upload | null>(null);

  const { data: user } = api.auth.getUser.useQuery();
  const createCourse = api.course.create.useMutation();
  const createLecture = api.lecture.create.useMutation();
  const uploadYoutube = api.lecture.uploadYoutube.useMutation();
  const uploadFile = api.lecture.uploadFile.useMutation();

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

  async function handleCreateLecture(type: "live" | "file" | "youtube") {
    if (isLoading) return;
    setIsLoading(true);

    // Create a new lecture, then forward to the record page.
    try {
      if (type === "live") {
        const lecture = await createLecture.mutateAsync({});
        router.push(`/(record)/record/${lecture.id}`);
      } else if (type === "youtube") {
        const lecture = await uploadYoutube.mutateAsync({
          videoUrl,
          generateNotes: true,
        });
        router.push(`/lecture/${lecture.id}`);
      } else {
        setIsPickingFile(true);

        const result = await DocumentPicker.getDocumentAsync({
          type: ["audio/*", "application/pdf"], // Allow audio files and PDFs
          multiple: false,
          copyToCacheDirectory: true,
        });

        if (result.canceled || result.assets.length === 0) {
          console.log("User cancelled document picker.");
          setIsPickingFile(false);
          return;
        }

        const file = result.assets[0];
        if (!file?.uri) throw new Error("No file uri!"); // Realistically, this should never happen, but just in case...

        // Generate file ID for upload
        const fileId = uuidv1();
        const path = `${user?.id}/${fileId}`;

        // Get the Supabase URL
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
        // Create the endpoint for resumable uploads
        const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

        try {
          // Get file info
          const fileInfo = await FileSystem.getInfoAsync(file.uri);
          if (!fileInfo.exists) throw new Error("File does not exist!");

          // Create a React Native compatible file object
          const rnFile: ReactNativeFileSource = {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
            size: fileInfo.size,
          };

          // Configure the TUS upload
          const upload = new Tus.Upload(rnFile as unknown as File, {
            endpoint,
            metadata: {
              // Required metadata for Supabase Storage
              bucketName: "audio",
              objectName: path,
              contentType: file.mimeType ?? "application/octet-stream",
              cacheControl: "3600",
            },
            headers: {
              // Pass your Supabase anon key as authorization
              // eslint-disable-next-line turbo/no-undeclared-env-vars
              Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            // Called when an error occurs during upload
            onError: (error: Error) => {
              console.error("Upload error:", error);
              Alert.alert("Upload error", error.message || "Unknown error");
              setIsPickingFile(false);
            },
            // Called when upload progress changes
            onProgress: (bytesUploaded: number, bytesTotal: number) => {
              const percentage = (bytesUploaded / bytesTotal) * 100;
              console.log(`Upload progress: ${percentage.toFixed(2)}%`);
              setUploadProgress(percentage);
            },
            // Called when upload is completed successfully
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onSuccess: async () => {
              console.log("Upload completed successfully");
              setUploadProgress(100);
              setIsGeneratingNotes(true);

              // Create the lecture entry in your database
              const lecture = await uploadFile.mutateAsync({
                fileId,
                generateNotes: true,
              });

              // Navigate to the lecture page
              router.push(`/lecture/${lecture.id}`);
              setIsPickingFile(false);
              setUploadProgress(0);
              setIsGeneratingNotes(false);
            },
          });

          // Store the upload instance to potentially cancel it later
          uploadRef.current = upload;
          upload.start();
        } catch (error) {
          console.error("Error setting up file upload:", error);
          Alert.alert(
            "Upload Error",
            error instanceof Error ? error.message : "Unknown error occurred",
          );
          setIsPickingFile(false);
        }
      }
    } catch (error) {
      Alert.alert(
        `Failed to create the note. ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error(error);
    } finally {
      if (type !== "file") {
        setIsLoading(false);
        setIsPickingFile(false);
        setIsYoutubeDialogOpen(false);
        setVideoUrl("");
      }
    }
  }

  // // Function to cancel ongoing upload
  // const cancelUpload = async () => {
  //   if (uploadRef.current) {
  //     await uploadRef.current.abort();
  //     uploadRef.current = null;
  //     setUploadProgress(0);
  //     setIsPickingFile(false);
  //   }
  // };

  async function onRefresh() {
    setRefreshing(true);
    await lectures.refetch();
    setRefreshing(false);
  }

  const handleLoadMore = () => {
    if (lectures.hasNextPage) void lectures.fetchNextPage();
  };

  if (lectures.data === undefined || lectures.data.pages.length === 0 || !user)
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
      <MicrophonePermission />
      <Stack.Screen
        options={{
          title: "Dashboard",
          headerLeft: () => (
            <>
              {shouldShowPaywall(
                user as {
                  stripeCurrentPeriodEnd?: string | null;
                  appStoreCurrentPeriodEnd?: string | null;
                },
              ) && (
                <Button
                  size="sm"
                  className="h-8 flex-row gap-x-2 rounded-full bg-primary/60"
                  onPress={() => {
                    void Superwall.shared.register("upgrade");
                  }}
                >
                  <Zap
                    size={10}
                    color={NAV_THEME[colorScheme].primaryForeground}
                    fill={NAV_THEME[colorScheme].primaryForeground}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                    }}
                    className="text-primary-foreground"
                  >
                    Upgrade
                  </Text>
                </Button>
              )}
            </>
          ),
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
            My notes
          </Text>
          <View className="mb-4 mt-4 flex-row items-center gap-x-2">
            {user.courses.length > 0 && (
              <Button
                size="sm"
                className="rounded-full"
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setCourseFilter(null);
                }}
              >
                <Text>{courseFilter ? courseFilter.name : "All notes"}</Text>
              </Button>
            )}
            <Dialog
              open={isCourseDialogOpen}
              onOpenChange={setIsCourseDialogOpen}
            >
              <BottomSheet>
                {user.courses.length === 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    onPress={() => setIsCourseDialogOpen(true)}
                  >
                    <Text>New course</Text>
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
                      {user.courses.map((course) => (
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
                    Add a new course to organize your notes.
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
                  Create a new note by clicking the plus button below.
                </EmptyPlaceholder.Description>
              </EmptyPlaceholder>
            )}
            {lectures.data.pages[0]?.items &&
              lectures.data.pages[0].items.length > 0 && (
                <View className="flex-col gap-y-2">
                  {lectures.data.pages.map((page) =>
                    page.items.map((lecture) => {
                      if (
                        courseFilter &&
                        lecture.courseId !== courseFilter.courseId
                      )
                        return null;

                      // Transform lecture to match expected types
                      const transformedLecture = {
                        ...lecture,
                        course: lecture.course
                          ? {
                              id: lecture.course.id,
                              name: lecture.course.name,
                            }
                          : undefined,
                      };

                      return (
                        <LectureItem
                          key={lecture.id}
                          lecture={transformedLecture}
                          onLecturePress={() => {
                            // Check if the user has an active Stripe subscription.
                            if (
                              !shouldShowPaywall(
                                user as {
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
                New Note
              </Text>
              <BottomSheetDismissButton
                size="lg"
                variant="secondary"
                className="w-full flex-row items-center justify-between px-4"
                onPress={async () => {
                  if (
                    !shouldShowPaywall(
                      user as {
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
              <Button
                size="lg"
                variant="secondary"
                className="w-full flex-row items-center justify-between px-4"
                onPress={async () => {
                  if (
                    !shouldShowPaywall(
                      user as {
                        stripeCurrentPeriodEnd?: string | null;
                        appStoreCurrentPeriodEnd?: string | null;
                      },
                    )
                  ) {
                    await handleCreateLecture("file");
                    return;
                  }

                  void Superwall.shared
                    .register("createLecture")
                    .then(async () => {
                      await handleCreateLecture("file");
                    });
                }}
                disabled={isPickingFile}
              >
                <View className="flex-col">
                  <View className="flex-row items-center gap-x-4">
                    <File
                      size={20}
                      color={NAV_THEME[colorScheme].secondaryForeground}
                    />
                    <Text>
                      {isPickingFile && uploadProgress > 0
                        ? isGeneratingNotes
                          ? "Upload complete. Processing..."
                          : `Uploading ${uploadProgress.toFixed(0)}%`
                        : "Upload File"}
                    </Text>
                  </View>
                </View>
                {isPickingFile ? (
                  <ActivityIndicator
                    size="small"
                    color={NAV_THEME[colorScheme].secondaryForeground}
                  />
                ) : (
                  <MoveRight
                    color={NAV_THEME[colorScheme].secondaryForeground}
                    size={20}
                  />
                )}
              </Button>
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
                    user as {
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
