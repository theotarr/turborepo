import { View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, Stack, useRouter } from "expo-router";
import MaskedViewIOS from "@react-native-masked-view/masked-view";

import { Button } from "~/components/ui/button";
import { GradientText, Text } from "~/components/ui/text";

export default function Index() {
  const router = useRouter();
  // if (user) {
  //   void AsyncStorage.getItem("onboardingComplete").then((value) => {
  //     if (value === "true") router.replace("/(dashboard)/dashboard");
  //   });
  //   return <Redirect href={"/onboarding"} />;
  // }

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
      <View className="h-full flex-1 px-5 pt-14">
        <GradientText text="Welcome to Levely" />
        <Text className="h-64 text-2xl text-secondary-foreground">
          My name is{" "}
          <Text className="text-2xl text-muted-foreground">name</Text> and I'm
          located at{" "}
          <Text className="text-2xl text-muted-foreground">your country</Text>.
          I study <Text className="text-2xl text-muted-foreground">major</Text>{" "}
          at <Text className="text-2xl text-muted-foreground">School</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}
