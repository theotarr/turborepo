import React, { useState } from "react";
import { Pressable, View } from "react-native";
import appsFlyer from "react-native-appsflyer";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as AppleAuthentication from "expo-apple-authentication";
import { Aperture } from "lucide-react-native";

import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { useSignIn } from "~/utils/auth";
import { setToken } from "~/utils/session-store";

export function AuthForm({ className }: { className?: string }) {
  const utils = api.useUtils();
  const { colorScheme } = useColorScheme();
  const [showButton, setShowButton] = useState(false);

  const signIn = useSignIn();
  const createMobileUser = api.auth.createMobileUser.useMutation();

  return (
    <View className={cn("w-full gap-y-4", className)}>
      <>
        {!showButton && (
          <Animated.View exiting={FadeOut}>
            <Pressable onPress={() => setShowButton(true)}>
              <Text className="text-center text-lg">
                Purchased on the web?{" "}
                <Text className="text-lg font-semibold">Sign In</Text>
              </Text>
            </Pressable>
          </Animated.View>
        )}
        {showButton && (
          <Animated.View entering={FadeIn}>
            <Button
              variant="outline"
              className="native:h-14 flex h-14 w-full flex-row gap-2 rounded-full"
              size="lg"
              onPress={async () => {
                await signIn();
                await appsFlyer.logEvent("af_login", {
                  af_registration_method: "web",
                });
              }}
            >
              <Aperture
                size={20}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
              <Text className="native:text-2xl text-2xl tracking-tight">
                Continue with KnowNotes.ai
              </Text>
            </Button>
          </Animated.View>
        )}
      </>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
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
          await appsFlyer.logEvent("af_login", {
            af_registration_method: "apple",
          });
          await utils.auth.getSession.invalidate();
        }}
      />
    </View>
  );
}
