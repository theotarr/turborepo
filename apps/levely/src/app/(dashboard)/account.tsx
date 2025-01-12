import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  SafeAreaView,
  Share,
  View,
} from "react-native";
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
    <ImageBackground
      source={require("~/../assets/background.png")}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="mx-4 mt-8 flex-1 flex-col gap-8">
          <View className="flex-col gap-4">
            <Text className="text-2xl font-medium text-secondary-foreground">
              For you
            </Text>
            <View className="flex-col gap-y-4">
              <Button
                variant="secondary"
                onPress={async () => await StoreReview.requestReview()}
                className="flex-row items-center gap-2"
              >
                <SymbolView
                  name="star.fill"
                  size={16}
                  resizeMode="scaleAspectFit"
                  tintColor={NAV_THEME.light.secondaryForeground}
                />
                <Text>Give Levely 5 Stars</Text>
              </Button>
              <Button
                variant="secondary"
                onPress={async () => {
                  await Share.share({
                    message: `Check out my Levely study scores!`,
                    url: `https://apps.apple.com/us/app/levely/id6740011673`,
                  });
                }}
                className="flex-row items-center gap-2"
              >
                <SymbolView
                  name="square.and.arrow.up"
                  size={16}
                  resizeMode="scaleAspectFit"
                  tintColor={NAV_THEME.light.secondaryForeground}
                />
                <Text>Share Levely</Text>
              </Button>
            </View>
          </View>
          <View className="flex-col gap-2">
            <Text className="text-2xl font-medium text-secondary-foreground">
              Data
            </Text>
            <Text className="text-sm text-muted-foreground/60">
              All your data is stored locally on your device. Deleting your
              account will remove all your data from the app.
            </Text>
            {/* <View className="flex-col gap-1.5">
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
                <ActivityIndicator
                  size="small"
                  color={NAV_THEME.light.primary}
                />
              )}
              <Text>Save</Text>
            </Button> */}
            <Button
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "Are you sure you want to delete your account? This action is irreversible.",
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
              className="w-40 flex-row items-center gap-2"
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
    </ImageBackground>
  );
}
