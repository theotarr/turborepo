import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { Redirect, Stack } from "expo-router";
import { Aperture } from "lucide-react-native";

import { TrustPilot } from "~/components/trust-pilot";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { useSignIn, useUser } from "~/utils/auth";

export default function Page() {
  const user = useUser();
  const signIn = useSignIn();
  const { colorScheme } = useColorScheme();

  if (user) {
    return <Redirect href={"/(dashboard)/dashboard"} />;
  }

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "" }} />
      <View className="flex h-full w-full flex-col justify-between p-4">
        <View className="flex flex-col items-center gap-4">
          <View className="mb-2 flex flex-row items-center gap-2">
            <Aperture
              size={20}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text className="text-xl font-semibold tracking-tighter text-secondary-foreground">
              KnowNotes
            </Text>
          </View>
          <Text className="text-center text-5xl font-bold tracking-tighter text-secondary-foreground">
            The AI Assistant{"\n"} For Students
          </Text>
          <View className="mt-4">
            <TrustPilot />
          </View>
        </View>
        <View className="w-full gap-2">
          {/* <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={100}
            style={{
              width: "100%",
              height: 56,
            }}
            onPress={async () => {
              try {
                const credential = await AppleAuthentication.signInAsync({
                  requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                  ],
                });
                console.log(credential);
                // signed in
              } catch (e) {
                if (e.code === "ERR_REQUEST_CANCELED") {
                  // handle that the user canceled the sign-in flow
                } else {
                  // handle other errors
                }
              }
            }}
          /> */}
          <Button
            variant="outline"
            className="flex w-full flex-row gap-2 rounded-full"
            size="lg"
            onPress={() => signIn()}
          >
            <Aperture
              size={20}
              color={NAV_THEME[colorScheme].secondaryForeground}
            />
            <Text className="native:text-xl text-xl">
              Continue on KnowNotes.ai
            </Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
