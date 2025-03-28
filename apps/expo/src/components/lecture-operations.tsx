import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { usePathname, useRouter } from "expo-router";
import { EllipsisVertical } from "lucide-react-native";
import { create } from "zustand";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface EditLectureDialogStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useEditLectureDialogStore = create<EditLectureDialogStore>(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  }),
);

interface LectureOperationsProps {
  lecture: {
    id: string;
    title: string;
    courseId?: string;
  };
  courses?: {
    id: string;
    name: string;
  }[];
}

export function LectureOperations({
  lecture,
  courses,
}: LectureOperationsProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const { colorScheme } = useColorScheme();
  const { open, setOpen } = useEditLectureDialogStore();
  const [title, setTitle] = useState(lecture.title);
  const [course, setCourse] = useState<
    | {
        value: string;
        label: string;
      }
    | undefined
  >(
    lecture.courseId
      ? {
          value: lecture.courseId,
          label: courses?.find((c) => c.id === lecture.courseId)?.name ?? "",
        }
      : undefined,
  );

  const updateLecture = api.lecture.update.useMutation();
  const deleteLecture = api.lecture.delete.useMutation();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update lecture</DialogTitle>
            <DialogDescription>
              Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <View className="flex-col gap-y-4 py-4">
            <View className="flex-row items-center justify-between gap-x-4">
              <Label nativeID="name" className="text-right">
                Name
              </Label>
              <Input
                nativeID="name"
                value={title}
                onChangeText={setTitle}
                className="w-64"
                autoComplete="off"
              />
            </View>
            {courses && (
              <View className="flex-row items-center justify-between gap-x-4">
                <Label nativeID="course" className="text-right">
                  Course
                </Label>
                <Select value={course} onValueChange={setCourse}>
                  <SelectTrigger className="w-64">
                    <SelectValue
                      className="text-base"
                      placeholder="Select a course"
                    />
                  </SelectTrigger>
                  <SelectContent className="w-64">
                    <SelectGroup>
                      <SelectLabel>Courses</SelectLabel>
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <SelectItem
                            key={course.id}
                            value={course.id}
                            label={course.name}
                          />
                        ))
                      ) : (
                        <Text className="py-2 pl-10 text-base font-medium text-secondary-foreground/70">
                          No courses
                        </Text>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </View>
            )}
          </View>
          <View className="flex-row items-center justify-end gap-x-4"></View>
          <DialogFooter>
            <Button
              onPress={async () => {
                await updateLecture.mutateAsync({
                  id: lecture.id,
                  title,
                  courseId: course?.value,
                });
                await utils.lecture.invalidate();
                setOpen(false);
              }}
              className="flex-row items-center gap-x-4"
              disabled={updateLecture.isPending}
            >
              {updateLecture.isPending && (
                <ActivityIndicator size="small" color="white" />
              )}
              <Text>Save</Text>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Pressable className="rounded-full p-2">
            <EllipsisVertical
              size={20}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
          </Pressable>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-36">
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                onPress={() => setOpen(true)}
                closeOnPress={false}
                className="w-full"
              >
                <Text>Edit</Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                onPress={async () => {
                  await Share.share({
                    message: `Hey check out my notes on ${lecture.title}`,
                    url: `https://knownotes.ai/share/${lecture.id}?ref=ios`,
                  });
                }}
              >
                <Text>Share notes</Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPress={() => {
                Alert.alert(
                  "Delete Lecture",
                  "Are you sure you want to delete this lecture? This action cannot be undone.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => {
                        void (async () => {
                          await deleteLecture.mutateAsync(lecture.id);
                          await utils.lecture.infiniteLectures.invalidate();

                          // Only navigate if not on dashboard
                          if (!isDashboard) {
                            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                            router.canGoBack()
                              ? router.back()
                              : router.replace("/(dashboard)/dashboard");
                          }
                        })();
                      },
                    },
                  ],
                );
              }}
              className="w-full"
            >
              <Text className="text-destructive">Delete</Text>
            </DropdownMenuItem>
          </Animated.View>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
