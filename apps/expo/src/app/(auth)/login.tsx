import { View } from "react-native";
import appsFlyer from "react-native-appsflyer";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { Stack } from "expo-router";
import { Aperture } from "lucide-react-native";

import { TrustPilot } from "~/components/trust-pilot";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";
import { useSignIn } from "~/utils/auth";
import { setToken } from "~/utils/session-store";

export default function Page() {
  const utils = api.useUtils();
  const { colorScheme } = useColorScheme();

  const signIn = useSignIn();
  const createMobileUser = api.auth.createMobileUser.useMutation();

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen
        options={{
          headerLeft: () => <></>,
          title: "",
        }}
      />
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
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              colorScheme === "light"
                ? AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                : AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            }
            cornerRadius={100}
            style={{
              width: "100%",
              height: 56,
            }}
            onPress={async () => {
              const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                  AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                  AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
              });

              // Signed in. Check to see if the user is new or existing and handle accordingly.
              const { user: appStoreUserId, email, fullName } = credential;
              const name = fullName
                ? `${fullName.givenName} ${fullName.familyName}`
                : undefined;
              await createMobileUser.mutateAsync({
                appStoreUserId,
                email: email ?? undefined,
                name: name ?? undefined,
              });

              // Store the app store user ID as then token prefixed with apple_. Then refetch the session to redirect.
              setToken(`apple_${appStoreUserId}`);
              await appsFlyer.logEvent("af_login", {});
              await utils.auth.getSession.invalidate();
            }}
          />
          <Button
            variant="outline"
            className="flex w-full flex-row gap-2 rounded-full"
            size="lg"
            onPress={async () => {
              await signIn();
              await appsFlyer.logEvent("af_login", {});
            }}
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
