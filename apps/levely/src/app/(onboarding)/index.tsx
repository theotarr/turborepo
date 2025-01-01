import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { GradientText } from "~/components/ui/gradient-text";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { setPersonalInfo } from "~/lib/storage";
import { cn } from "~/lib/utils";

export default function Index() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [major, setMajor] = useState("");
  const [school, setSchool] = useState("");

  async function handleSubmit() {
    await setPersonalInfo({ name, location, major, school });
    router.replace("/onboarding");
  }

  return (
    <SafeAreaView className="h-full flex-1">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="h-full flex-1 px-5 pt-36">
        <GradientText
          text="Hello, who are you?"
          height={32}
          colors={["#D6645D", "#BC688E", "#9476C5", "#4F87ED", "#439DDF"]}
          locations={[0, 0.52, 0.78, 0.89, 1]}
          className="text-3xl font-bold text-primary"
        />
        <View className="mt-8 h-64 flex-row flex-wrap items-center">
          <View className="flex-row items-center">
            <Text className="text-3xl leading-[1.4] text-secondary-foreground">
              My name is{" "}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="name"
              placeholderTextColor={NAV_THEME.light.placeholder}
              className="text-3xl font-medium italic text-primary"
            />
            <Text className="text-3xl leading-[1.4] text-secondary-foreground">
              {" "}
              and I'm{" "}
            </Text>
          </View>
          <Text className="text-3xl leading-[1.4] text-secondary-foreground">
            located in{" "}
          </Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="country/city"
            placeholderTextColor={NAV_THEME.light.placeholder}
            className="text-3xl font-medium italic text-primary"
          />
          <Text className="text-3xl leading-[1.4] text-secondary-foreground">
            . I study{" "}
          </Text>
          <TextInput
            value={major}
            onChangeText={setMajor}
            placeholder="major"
            placeholderTextColor={NAV_THEME.light.placeholder}
            className="text-3xl font-medium italic text-primary"
          />
          <Text className="text-3xl leading-[1.4] text-secondary-foreground">
            {" "}
            at{" "}
          </Text>
          <TextInput
            value={school}
            onChangeText={setSchool}
            placeholder="school"
            placeholderTextColor={NAV_THEME.light.placeholder}
            className="text-3xl font-medium italic text-primary"
          />
          <Text className="text-3xl leading-[1.4] text-secondary-foreground">
            .
          </Text>
        </View>
        <Animated.View
          className={cn(
            "hidden h-full",
            name.length > 0 &&
              location.length > 0 &&
              major.length > 0 &&
              school.length > 0 &&
              "block",
          )}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
        >
          <Pressable
            className="absolute -bottom-4 right-4 flex size-16 items-center justify-center rounded-full bg-primary"
            onPress={handleSubmit}
          >
            <SymbolView
              name="arrow.right"
              resizeMode="scaleAspectFit"
              size={24}
              weight="light"
              tintColor="white"
            />
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
