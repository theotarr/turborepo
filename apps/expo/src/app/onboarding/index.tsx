import type { ViewToken } from "react-native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { Link, Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react-native";

import ListItem from "~/components/onboarding-item";
import { PaginationElement } from "~/components/pagination-element";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";

export default function App() {
  const utils = api.useUtils();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const x = useSharedValue(0);
  const [course, setCourse] = useState("");
  const [flatListIndex, setFlatListIndex] = useState(0);
  const flatListRef = useAnimatedRef<
    Animated.FlatList<{
      text: string;
      content: React.ReactNode;
    }>
  >();
  const user = api.auth.getUser.useQuery();
  const createCourseMutation = api.course.create.useMutation();
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setFlatListIndex(viewableItems[0]?.index ?? 0);
    },
    [],
  );
  const scrollHandle = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: { text: string; content: React.ReactNode };
      index: number;
    }) => {
      return <ListItem item={item} index={index} x={x} />;
    },
    [x],
  );

  const pages = [
    {
      text: "How to use KnowNotes",
      content: (
        <Link
          className="items-center justify-center shadow-lg"
          href="https://www.loom.com/share/5f1fbb33b9a44d5ab2d61928d30af528"
        >
          <Image
            alt="KnowNotes tutorial"
            style={{
              flex: 1,
              width: 300,
              height: 225,
              borderRadius: 8,
            }}
            className=""
            source={{
              uri: "https://cdn.loom.com/sessions/thumbnails/5f1fbb33b9a44d5ab2d61928d30af528-with-play.gif",
            }}
          />
        </Link>
      ),
    },
    {
      text: "Sync across devices",
      content: (
        <View>
          <View className="flex flex-col items-center gap-4">
            <View className="flex flex-row items-center justify-center gap-4">
              <View className="flex flex-col items-center">
                <View className="h-28 w-16 rounded-2xl bg-muted p-2">
                  <View className="h-full w-full rounded-lg bg-background" />
                </View>
                <Text className="mt-2 text-sm font-medium">Mobile</Text>
              </View>
              <View className="flex flex-col items-center justify-center gap-2">
                <View className="flex flex-row gap-1">
                  <ArrowRight size={24} className="text-muted-foreground" />
                  <ArrowLeft size={24} className="text-muted-foreground" />
                </View>
                <Text className="text-sm text-muted-foreground">Sync</Text>
              </View>
              <View className="flex flex-col items-center">
                <View className="h-24 w-32 rounded-2xl bg-muted p-2">
                  <View className="h-full w-full rounded-lg bg-background" />
                </View>
                <Text className="mt-2 text-sm font-medium">Web</Text>
              </View>
            </View>
            <Text className="mt-4 text-center text-lg text-muted-foreground">
              Record lectures on your phone and access your notes anywhere
            </Text>
          </View>
        </View>
      ),
    },
    {
      text: "What courses are you taking?",
      content: (
        <View className="flex flex-col justify-center">
          <View className="flex flex-col gap-1.5">
            <Label nativeID="course">Course Name</Label>
            <View className="flex max-w-full flex-row items-center gap-2">
              <Input
                className="flex-1"
                placeholder="e.g. CS 50"
                value={course}
                onChangeText={setCourse}
                aria-labelledby="course"
              />
              <Button
                className="w-12"
                disabled={createCourseMutation.isPending}
                onPress={async () => {
                  if (!course || course.length === 0) return;
                  await createCourseMutation.mutateAsync({
                    name: course,
                  });
                  setCourse("");
                  await utils.auth.getUser.invalidate();
                }}
              >
                {createCourseMutation.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={NAV_THEME[colorScheme].primaryForeground}
                  />
                ) : (
                  <Plus
                    size={16}
                    color={NAV_THEME[colorScheme].primaryForeground}
                  />
                )}
              </Button>
            </View>
          </View>
          <Text className="mt-2 text-sm text-muted-foreground">
            We group your lectures by course to create a personal AI tutor for
            each course.
          </Text>
          <ScrollView className="mt-8 flex h-96 flex-col gap-2">
            {user.data?.courses.map((course) => (
              <View
                key={course.id}
                className="mb-2 flex flex-row items-center justify-between gap-2 rounded border border-border p-2.5"
              >
                <Text className="text-lg font-medium text-secondary-foreground">
                  {course.name}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {new Date(course.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year:
                      new Date(course.createdAt).getFullYear() !==
                      new Date().getFullYear()
                        ? "numeric"
                        : undefined,
                  })}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ),
    },
  ];

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ header: () => <></> }} />
      <Animated.FlatList
        ref={flatListRef}
        onScroll={scrollHandle}
        horizontal
        scrollEventThrottle={16}
        pagingEnabled={true}
        data={pages}
        keyExtractor={(_, index) => index.toString()}
        bounces={false}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
      />
      <View className="flex flex-row items-center justify-between px-6">
        <PaginationElement length={pages.length} x={x} />
        <Button
          className="rounded-full"
          onPress={async () => {
            if (flatListIndex === pages.length - 1) {
              await AsyncStorage.setItem("onboardingComplete", "true");
              router.replace("/(dashboard)/dashboard");
              return;
            }

            flatListRef.current?.scrollToIndex({
              index: flatListIndex + 1,
            });
          }}
        >
          <View className="flex flex-row items-center">
            <Text className="mr-2">Continue</Text>
            <ArrowRight
              color={NAV_THEME[colorScheme].primaryForeground}
              // fill={NAV_THEME[colorScheme].primaryForeground}
              size={16}
            />
          </View>
        </Button>
      </View>
    </SafeAreaView>
  );
}
