import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as StoreReview from "expo-store-review";
import { SymbolView } from "expo-symbols";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { deleteAccount, getPersonalInfo, setPersonalInfo } from "~/lib/storage";

export default function Account() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const info = await getPersonalInfo();
      if (info) {
        setName(info.name);
        setLocation(info.location);
        setSchool(info.school);
        setMajor(info.major);
      }
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
      <View className="mx-4 mt-8 flex-1 flex-col gap-8">
        <View className="flex-col gap-4">
          <Text className="text-2xl font-medium text-secondary-foreground">
            For you
          </Text>
          <View className="flex-row gap-2">
            <Button
              onPress={async () => await StoreReview.requestReview()}
              className="flex-row items-center gap-2"
            >
              <SymbolView name="star.fill" size={16} tintColor="white" />
              <Text>Give Levely 5 Stars</Text>
            </Button>
          </View>
        </View>
        <View className="flex-col gap-4">
          <Text className="text-2xl font-medium text-secondary-foreground">
            Account
          </Text>
          <View className="flex-col gap-1.5">
            <Label nativeID="name">Name</Label>
            <Input
              nativeID="name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
          </View>
          <View className="flex-col gap-1.5">
            <Label nativeID="location">Location</Label>
            <Input
              nativeID="location"
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
            />
          </View>
          <View className="flex-col gap-1.5">
            <Label nativeID="school">School</Label>
            <Input
              nativeID="school"
              value={school}
              onChangeText={setSchool}
              placeholder="Enter your school"
            />
          </View>
          <View className="flex-col gap-1.5">
            <Label nativeID="major">Major</Label>
            <Input
              nativeID="major"
              value={major}
              onChangeText={setMajor}
              placeholder="Enter your major"
            />
          </View>
          <Button
            onPress={async () => {
              setIsLoading(true);
              await new Promise((resolve) => setTimeout(resolve, 400));
              await setPersonalInfo({ name, location, school, major });
              setIsLoading(false);
            }}
            className="mt-4 flex-row items-center gap-2"
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading && (
              <ActivityIndicator size="small" color={NAV_THEME.light.primary} />
            )}
            <Text>Save</Text>
          </Button>
          <Button
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "Are you sure you want to delete your account?",
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
                        await deleteAccount();
                      })();
                      router.replace("/");
                    },
                  },
                ],
              );
            }}
            variant="ghost"
            size="sm"
            className="mt-6 w-40 flex-row items-center gap-2"
          >
            <SymbolView
              name="trash"
              size={16}
              style={{ opacity: 0.6 }}
              tintColor="black"
            />
            <Text className="text-muted-foreground/60">Delete Account</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
