import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";
import appsFlyer from "react-native-appsflyer";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Superwall from "@superwall/react-native-superwall";
import { ArrowLeft, CircleCheckBig, Plus } from "lucide-react-native";

import { OnboardingDictaphone } from "~/components/dictaphone";
import { OnboardingQuestionItem } from "~/components/onboarding-question-item";
import OnboardingScreen from "~/components/onboarding-screen";
import { ReviewCard } from "~/components/review-card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { capitalizeWords } from "~/lib/utils";
import { api } from "~/utils/api";
import { shouldShowPaywall } from "~/utils/subscription";

function formatRole(role: string | null) {
  switch (role) {
    case "Undergraduate student":
      return "undergrads";
    case "Graduate student":
      return "grads";
    case "High school student":
      return "high schoolers";
    case "Professional":
      return "professionals";
    case "Parent":
      return "parents";
    case "Teacher":
      return "teachers";
  }

  return "people";
}

const socials = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "Friend",
  "Other",
];
export default function App() {
  const utils = api.useUtils();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { data: user } = api.auth.getUser.useQuery();
  const createCourseMutation = api.course.create.useMutation();

  const [index, setIndex] = useState(0);
  const [course, setCourse] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStudyHours, setSelectedStudyHours] = useState<string | null>(
    null,
  );
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [requestedRating, setRequestedRating] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [getStarted, setGetStarted] = useState(false);
  const fadeAnim = useSharedValue(1);

  const fadeIn = useCallback(() => {
    fadeAnim.value = withTiming(1, { duration: 100 });
  }, [fadeAnim]);
  const fadeOut = useCallback(() => {
    fadeAnim.value = withTiming(0, { duration: 100 });
  }, [fadeAnim]);
  const handlePageChange = useCallback(
    (index: number) => {
      // Handle the animations of page changes.
      fadeOut();
      setTimeout(() => {
        setIndex(index);
        fadeIn();
      }, 150);
    },
    [fadeIn, fadeOut],
  );

  const bounceAnimation = useSharedValue(0);
  const bounceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: bounceAnimation.value,
        },
      ],
    };
  });
  useEffect(() => {
    bounceAnimation.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 750 }),
        withTiming(0, { duration: 750 }),
      ),
      -1,
      true,
    );
  }, [bounceAnimation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const screens = useMemo(
    () => [
      // {
      //   text: "Never take notes again",
      //   description: "Just hit record in class and we'll do the rest.",
      //   containerClassName:
      //     "w-full flex-1 flex-col items-center justify-center px-8",
      //   showNextButton: true,
      //   content: <OnboardingDictaphone />,
      // },
      {
        text: "What describes you best?",
        description:
          "This will be used to create your personalized experience.",
        containerClassName: "mt-8 px-6 flex-col items-center justify-center",
        showNextButton: selectedRole !== null,
        content: (
          <ScrollView className="w-full">
            <View className="flex flex-col gap-y-3">
              {[
                "Undergraduate student",
                "Graduate student",
                "High school student",
                "Professional",
                "Parent",
                "Teacher",
                "Other",
              ].map((text) => (
                <OnboardingQuestionItem
                  key={text}
                  isSelected={selectedRole === text}
                  onSelect={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRole(text);
                  }}
                  text={text}
                />
              ))}
            </View>
          </ScrollView>
        ),
      },
      {
        text: "How much do you study each week?",
        description:
          "This will be used to create your personalized experience.",
        containerClassName: "mt-8 px-6 flex-col items-center justify-center",
        showNextButton: selectedStudyHours !== null,
        content: (
          <ScrollView className="w-full">
            <View className="flex flex-col gap-y-3">
              {[
                "< 1 hour",
                "1-2 hours",
                "3-5 hours",
                "5-8 hours",
                "> 8 hours",
              ].map((text, idx) => (
                <OnboardingQuestionItem
                  key={idx}
                  isSelected={selectedStudyHours === text}
                  onSelect={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedStudyHours(text);
                  }}
                  text={text}
                />
              ))}
            </View>
          </ScrollView>
        ),
      },
      {
        text: "KnowNotes creates tangible results",
        description: "",
        containerClassName: "mt-8 px-6 flex-col items-center justify-center",
        showNextButton: true,
        content: (
          <View className="flex w-full flex-col items-center">
            <View className="w-full max-w-md rounded-xl border border-border bg-secondary p-6">
              <Text className="text-lg font-medium text-secondary-foreground">
                Your Stats
              </Text>
              <View className="mt-8 flex w-full flex-row items-center justify-around">
                <View className="flex flex-col items-center">
                  <Text className="text-3xl font-semibold tracking-tighter text-secondary-foreground">
                    +0.3
                  </Text>
                  <Text className="text-base text-muted-foreground">
                    GPA increase
                  </Text>
                </View>
                <View className="flex flex-col items-center">
                  <Text className="text-3xl font-semibold tracking-tighter text-secondary-foreground">
                    2.5 hrs
                  </Text>
                  <Text className="text-base text-muted-foreground">
                    saved per week
                  </Text>
                </View>
              </View>
              <Text className="mt-10 text-center text-sm text-muted-foreground">
                Based on 100k+ KnowNotes users from top universities around the
                world.
              </Text>
            </View>
          </View>
        ),
      },
      {
        text: "Where did you hear about us?",
        description: "This will help us improve our service.",
        containerClassName: "mt-8 px-6 flex-col items-center justify-center",
        showNextButton: selectedSource !== null,
        content: (
          <ScrollView className="w-full">
            <View className="flex flex-col gap-y-3">
              {socials.map((name) => (
                <OnboardingQuestionItem
                  key={name}
                  isSelected={selectedSource === name}
                  onSelect={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSource(name);
                  }}
                  text={name}
                />
              ))}
            </View>
          </ScrollView>
        ),
      },
      {
        text: "What classes are you taking?",
        description:
          "We'll create a personalized AI tutor for each of your courses.",
        showNextButton: true,
        containerClassName: "mt-8 px-6 flex-col items-center justify-center",
        content: (
          <>
            <View className="flex w-full max-w-lg flex-col gap-1.5">
              <Label nativeID="course">Class Name</Label>
              <View className="flex flex-row items-center gap-2">
                <Input
                  className="native:h-14 h-14 flex-1 rounded-xl"
                  placeholder="e.g. CS 50"
                  value={course}
                  onChangeText={setCourse}
                  aria-labelledby="course"
                />
                <Button
                  className="native:h-14 h-14 w-14 rounded-xl"
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
                      size={20}
                      color={NAV_THEME[colorScheme].primaryForeground}
                    />
                  )}
                </Button>
              </View>
            </View>
            {user?.courses.length === 0 && (
              <Animated.Text
                exiting={FadeOut}
                className="mt-6 text-center text-sm text-muted-foreground"
              >
                You don't have any classes yet.
              </Animated.Text>
            )}
            <ScrollView className="mt-8 flex h-96 w-full max-w-lg flex-col gap-2">
              {user?.courses.map((course) => (
                <Animated.View
                  entering={FadeIn}
                  key={course.id}
                  className="mb-2 flex flex-row items-center justify-between gap-x-2 rounded-xl bg-secondary px-4 py-3"
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
                </Animated.View>
              ))}
            </ScrollView>
          </>
        ),
      },
      {
        text: "What's stopping you from reaching your academic goals?",
        description: "",
        containerClassName: "mt-8 px-6 flex-col items-center justify-center",
        showNextButton: true,
        content: (
          <ScrollView className="w-full">
            <View className="flex flex-col gap-y-3">
              {[
                "Lack of time",
                "Poor study habits",
                "Lack of motivation",
                "Distractions",
                "Difficult subjects",
              ].map((text) => (
                <OnboardingQuestionItem
                  key={text}
                  isSelected={selectedRole === text}
                  onSelect={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRole(text);
                  }}
                  text={text}
                />
              ))}
            </View>
          </ScrollView>
        ),
      },
      {
        text: "Recording Reminders",
        description: "You're 2x more likely to take notes with reminders.",
        showNextButton: true,
        // onActive: async () => {
        //   const { status } = await Notifications.requestPermissionsAsync();

        //   // Check if permission was granted
        //   // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        //   if (status === "granted") {
        //     handlePageChange(index + 1);
        //   }
        // },
        containerClassName: "flex flex-col items-center justify-center px-8",
        content: (
          <View className="flex items-center justify-center rounded-2xl bg-secondary px-8 py-6">
            <Text className="mb-14 text-center text-2xl font-semibold text-secondary-foreground">
              KnowNotes would like to send you Notifications
            </Text>
            <View className="absolute bottom-0 left-0 right-0 mt-4 flex-row border-t border-border">
              <Button
                size="lg"
                className="flex-1 rounded-b-none rounded-t-none rounded-bl-2xl"
                variant="secondary"
                onPress={() => handlePageChange(index + 1)}
              >
                <Text>Don't Allow</Text>
              </Button>
              <Button
                size="lg"
                className="relative flex-1 rounded-b-none rounded-t-none rounded-br-2xl"
                onPress={async () => {
                  const { status } =
                    await Notifications.requestPermissionsAsync();

                  // Check if permission was granted
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                  if (status === "granted") {
                    // Next page
                    console.log("Notification permissions granted!");
                    handlePageChange(index + 1);
                  } else {
                    console.log("Notification permissions denied");
                  }
                }}
              >
                <Text>Allow</Text>
                <Animated.View
                  style={[
                    bounceStyle,
                    {
                      position: "absolute",
                      bottom: -55,
                      left: "50%",
                    },
                  ]}
                >
                  <Text className="text-4xl">👆</Text>
                </Animated.View>
              </Button>
            </View>
          </View>
        ),
      },
      {
        text: "Give us a rating",
        description: "",
        showNextButton: requestedRating,
        onActive: () => {
          if (requestedRating) return;
          setRequestedRating(true);
          setTimeout(() => {
            void StoreReview.requestReview();
          }, 1000);
        },
        content: (
          <ScrollView className="flex w-full">
            <View className="mb-8 flex w-full items-center justify-center px-4">
              <Text className="mb-12 w-full rounded-xl border border-border p-6 text-center text-4xl tracking-[0.15em]">
                ⭐️⭐️⭐️⭐️⭐️
              </Text>
              <Text className="mb-4 max-w-xs text-center text-3xl font-semibold tracking-tight">
                KnowNotes was made for {formatRole(selectedRole)} like you
              </Text>
              <View className="mb-2 ml-4 flex flex-row items-center justify-center">
                <View className="flex-row">
                  <Image
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
                    source={require("~/../assets/erik.jpg")}
                    className="-ml-6 size-20 rounded-full border-2 border-background"
                    style={{ zIndex: 3 }}
                  />
                  <Image
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
                    source={require("~/../assets/sam.jpg")}
                    className="-ml-6 size-20 rounded-full border-2 border-background"
                    style={{ zIndex: 2 }}
                  />
                  <Image
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
                    source={require("~/../assets/momo.jpg")}
                    className="-ml-6 size-20 rounded-full border-2 border-background"
                    style={{ zIndex: 1 }}
                  />
                </View>
              </View>
              <Text className="text-center text-sm font-medium">
                +100k KnowNotes users
              </Text>
            </View>
            <View className="flex flex-col gap-y-4 px-4">
              <ReviewCard
                name="Theo Tarr"
                university="Harvard University"
                rating={5}
                review="I went from a 3.2 to a 3.9 GPA in 2 months! I was about to drop bio, but have this app a shot and it worked :)"
              />
              <ReviewCard
                name="Alex Chen"
                university="Stanford University"
                rating={5}
                review="I've saved so much time taking notes and studying. I can hang out with friends and not feel bad about it."
              />
            </View>
          </ScrollView>
        ),
      },
      {
        text: "",
        description: "",
        showNextButton: getStarted,
        onActive: () => {
          setTimeout(() => setShowTips(true), 3500); // 3.5 seconds
          setTimeout(() => setGetStarted(true), 8500);
        },
        content: (
          <>
            {showTips ? (
              <View className="flex-1 items-center px-6">
                <Animated.View entering={FadeIn} className="mb-2 items-center">
                  <CircleCheckBig
                    size={24}
                    color={NAV_THEME[colorScheme].secondaryForeground}
                  />
                </Animated.View>
                <Animated.Text
                  entering={FadeIn}
                  className="mb-8 max-w-xs text-center text-3xl font-semibold text-secondary-foreground"
                >
                  Your personal tutor is ready!
                </Animated.Text>
                <Animated.View
                  entering={FadeIn.delay(1000)}
                  className="mb-4 w-full flex-row items-center gap-x-4 rounded-xl bg-secondary p-5"
                >
                  <Text className="text-left text-3xl">🎓</Text>
                  <View className="flex-1">
                    <Text className="text-left text-xl font-semibold tracking-tight text-secondary-foreground">
                      Smart Studying for{" "}
                      {selectedRole
                        ? capitalizeWords(formatRole(selectedRole))
                        : "Students"}
                    </Text>
                    <Text className="mt-2 text-left text-base font-medium leading-tight text-muted-foreground">
                      8,250+ other{" "}
                      {selectedRole ? formatRole(selectedRole) : "students"} are
                      using KnowNotes to study smarter and save time.
                    </Text>
                  </View>
                </Animated.View>
                <Animated.View
                  entering={FadeIn.delay(2500)}
                  className="mb-4 w-full flex-row items-center gap-x-4 rounded-xl bg-secondary p-5"
                >
                  <Text className="text-left text-3xl">📈</Text>
                  <View className="flex-1">
                    <Text className="text-left text-xl font-semibold tracking-tight text-secondary-foreground">
                      Boost Your GPA
                    </Text>
                    <Text className="mt-2 text-left text-base font-medium leading-tight text-muted-foreground">
                      The average student using KnowNotes sees their GPA rise by
                      0.3.
                    </Text>
                  </View>
                </Animated.View>
                <Animated.View
                  entering={FadeIn.delay(4000)}
                  className="mb-4 w-full flex-row items-center gap-x-4 rounded-xl bg-secondary p-5"
                >
                  <Text className="text-left text-3xl">⏰</Text>
                  <View className="flex-1">
                    <Text className="text-left text-xl font-semibold tracking-tight text-secondary-foreground">
                      Work Smarter, Not Harder
                    </Text>
                    <Text className="mt-2 text-left text-base font-medium leading-tight text-muted-foreground">
                      The average KnowNotes user saves 2.5 hours per week.
                    </Text>
                  </View>
                </Animated.View>
              </View>
            ) : (
              <Animated.View
                exiting={FadeOut}
                className="flex-1 items-center justify-center"
              >
                <Text className="mb-6 max-w-xs text-center text-3xl font-semibold text-secondary-foreground">
                  We're setting everything up for you
                </Text>
                <ActivityIndicator
                  size="large"
                  color={NAV_THEME[colorScheme].secondaryForeground}
                />
              </Animated.View>
            )}
          </>
        ),
      },
    ],
    [
      selectedRole,
      selectedSource,
      course,
      createCourseMutation,
      colorScheme,
      user?.courses,
      showTips,
      utils.auth.getUser,
      handlePageChange,
      index,
      requestedRating,
    ],
  );

  useEffect(() => {
    // On page switch, run the onActive function if it exists.
    if (screens[index]?.onActive) {
      void screens[index].onActive();
    }
  }, [index, screens]);

  return (
    <SafeAreaView className="flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="h-12 flex-1 flex-row items-center">
            {index > 0 && (
              <Button
                className="rounded-full"
                size="icon"
                variant="secondary"
                onPress={() => {
                  fadeOut();
                  setTimeout(() => {
                    setIndex((prevIndex) => prevIndex - 1);
                    fadeIn();
                  }, 150);
                }}
              >
                <ArrowLeft
                  size={16}
                  color={NAV_THEME[colorScheme].secondaryForeground}
                />
              </Button>
            )}
            <View className="mx-4 flex-1">
              <Progress
                className="h-1"
                value={((index + 1) / screens.length) * 100}
              />
            </View>
          </View>
        </View>
      </View>
      <Animated.View className="flex-1" style={animatedStyle}>
        {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
        <OnboardingScreen item={screens[index]!} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={10}
        className="mb-4 w-full"
      >
        <Button
          className="mx-4 items-center rounded-full"
          size="lg"
          disabled={!screens[index]?.showNextButton}
          onPress={async () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (index === screens.length - 1) {
              // Mark onboarding as complete. Send the analytics event to AppsFlyer.
              await appsFlyer.logEvent("af_onboarding_completion", {});

              if (user) {
                await Superwall.shared.identify(user.id);

                if (
                  shouldShowPaywall(
                    user as {
                      stripeCurrentPeriodEnd?: string | null;
                      appStoreCurrentPeriodEnd?: string | null;
                    },
                  )
                ) {
                  void Superwall.shared
                    .register("onboarding")
                    .then(async () => {
                      await AsyncStorage.setItem("onboardingComplete", "true");
                      router.replace("/(dashboard)/dashboard");
                    });
                } else {
                  await AsyncStorage.setItem("onboardingComplete", "true");
                  router.replace("/(dashboard)/dashboard");
                }

                return;
              }
            }

            fadeOut();
            if (index < screens.length - 1) {
              setTimeout(() => {
                setIndex((prevIndex) => prevIndex + 1);
                fadeIn();
              }, 150);
            }
          }}
        >
          <Text className="text-xl font-semibold">
            {index === screens.length - 1 ? "Let's Get Started" : "Next"}
          </Text>
        </Button>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
