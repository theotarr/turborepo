import React from "react";
import { Pressable, View } from "react-native";
import appsFlyer from "react-native-appsflyer";
import * as AppleAuthentication from "expo-apple-authentication";
import { usePathname, useRouter } from "expo-router";

import { Text } from "~/components/ui/text";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { useSignIn } from "~/utils/auth";
import { setToken } from "~/utils/session-store";

export function AuthForm({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const utils = api.useUtils();
  const { colorScheme } = useColorScheme();

  const signIn = useSignIn();
  const createMobileUser = api.auth.createMobileUser.useMutation();

  return (
    <View className={cn("w-full gap-y-4", className)}>
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

          // Store the app store user ID as then token prefixed with apple_.
          // Refetch the session to redirect.
          setToken(`apple_${appStoreUserId}`);
          await appsFlyer.logEvent("af_login", {
            af_registration_method: "apple",
          });
          await utils.auth.getSession.invalidate();

          // If current route is `/login`, redirect to `/`.
          if (pathname.endsWith("/login")) {
            router.replace("/");
          }
        }}
      />
      <Pressable
        onPress={async () => {
          await signIn();
          await appsFlyer.logEvent("af_login", {
            af_registration_method: "web",
          });
        }}
      >
        <Text className="text-center text-lg">
          Purchased on the web?{" "}
          <Text className="text-lg font-semibold">Sign In</Text>
        </Text>
      </Pressable>
    </View>
  );
}
