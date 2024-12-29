import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";

import { Button } from "~/components/ui/button";
import { GradientInput, GradientText } from "~/components/ui/gradient-text";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";

export default function Index() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [major, setMajor] = useState("");
  const [school, setSchool] = useState("");

  // if (user) {
  //   void AsyncStorage.getItem("onboardingComplete").then((value) => {
  //     if (value === "true") router.replace("/(dashboard)/dashboard");
  //   });
  //   return <Redirect href={"/onboarding"} />;
  // }

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
      <View className="h-full flex-1 px-5 pt-36">
        <GradientText
          text="Hello, who are you?"
          height={32}
          colors={["#D6645D", "#BC688E", "#9476C5", "#4F87ED", "#439DDF"]}
          locations={[0, 0.52, 0.78, 0.89, 1]}
          className="text-3xl font-bold text-primary"
        />
        <Text className="mt-8 h-64 text-3xl text-secondary-foreground">
          My name is{" "}
          <Input
            // value={name}
            // onChangeText={setName}
            // height={32}
            placeholder="name"
            // className="text-3xl font-medium"
            // aria-labelledby="name"
          />{" "}
          and I'm located at{" "}
          <Text className="text-3xl text-muted-foreground/40">
            your country
          </Text>
          . I study{" "}
          <Text className="text-3xl text-muted-foreground/40">major</Text> at{" "}
          <Text className="text-3xl text-muted-foreground/40">School</Text>.
        </Text>
        <Button onPress={() => router.push("/onboarding")}>
          <Text>Onboarding</Text>
        </Button>
        <Button onPress={() => router.push("/stats/current")}>
          <Text>stats</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
