import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, View } from "react-native";
import { Link, Stack, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { ChevronLeft, LogOut } from "lucide-react-native";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";
import { useSignOut } from "~/utils/auth";

export default function SettingsPage() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const user = api.auth.getUser.useQuery();
  const updateUser = api.auth.update.useMutation();
  const signOut = useSignOut();

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!user.data) return;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setName(user.data.name!);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setEmail(user.data.email!);
  }, [user.data]);

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          title: "Settings",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                router.replace("/(dashboard)/dashboard");
              }}
            >
              <ChevronLeft
                size={20}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
            </Pressable>
          ),
        }}
      />

      <View className="flex h-full w-full flex-col gap-6 px-4 py-6">
        <View className="flex flex-col">
          <Label nativeID="theme">Theme</Label>
          <Picker
            selectedValue={colorScheme}
            onValueChange={setColorScheme}
            style={{
              backgroundColor: "transparent",
              borderRadius: 8,
              marginTop: -56,
              marginBottom: -24,
            }}
            itemStyle={{
              color: NAV_THEME[colorScheme].secondaryForeground,
            }}
          >
            <Picker.Item label="Light" value="light" />
            <Picker.Item label="Dark" value="dark" />
          </Picker>
        </View>
        <View className="flex flex-col gap-1.5">
          <Label nativeID="name">Name</Label>
          <Input value={name} onChangeText={setName} aria-labelledby="name" />
        </View>
        <View className="flex flex-col gap-1.5">
          <Label nativeID="email">Email</Label>
          <Input value={email} aria-labelledby="email" aria-disabled />
          <Text className="mt-2 text-sm text-muted-foreground">
            Update your email on{" "}
            <Link
              className="underline"
              href="https://knownotes.ai/dashboard/settings"
            >
              KnowNotes.ai
            </Link>
            .
          </Text>
        </View>
        <View className="items-start">
          <Button
            onPress={() => {
              void signOut().then(() => router.replace("/"));
            }}
            variant="ghost"
            size="sm"
            className="flex flex-row gap-2"
          >
            <LogOut
              size={16}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text className="text-sm">Sign Out</Text>
          </Button>
        </View>
        <View className="mt-6 flex flex-row justify-end">
          <Button
            onPress={async () => {
              setIsLoading(true);
              await updateUser.mutateAsync({ name });
              setIsLoading(false);
            }}
            className="flex flex-row gap-2"
          >
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={NAV_THEME[colorScheme].primaryForeground}
              />
            )}
            <Text>Save</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
