import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as Browser from "expo-web-browser";
import Superwall from "@superwall/react-native-superwall";

import { api } from "./api";
import { getBaseUrl } from "./base-url";
import { deleteToken, setToken } from "./session-store";

export const signIn = async () => {
  const signInUrl = `${getBaseUrl()}/api/auth/signin`;
  const redirectTo = Linking.createURL("/login");
  const result = await Browser.openAuthSessionAsync(
    `${signInUrl}?expo-redirect=${encodeURIComponent(redirectTo)}`,
    redirectTo,
  );

  if (result.type !== "success") return;
  const url = Linking.parse(result.url);
  const sessionToken = String(url.queryParams?.session_token);
  if (!sessionToken) return;

  setToken(sessionToken);
};

export const signUp = async () => {
  const signUpUrl = `${getBaseUrl()}/register`;
  const redirectTo = Linking.createURL("/register");
  const result = await Browser.openAuthSessionAsync(
    `${signUpUrl}?expo-redirect=${encodeURIComponent(redirectTo)}`,
    redirectTo,
  );

  if (result.type !== "success") return;
  const url = Linking.parse(result.url);
  const sessionToken = String(url.queryParams?.session_token);
  if (!sessionToken) return;

  setToken(sessionToken);
};

export const useUser = () => {
  const { data: session } = api.auth.getSession.useQuery();
  if (session?.user) {
    void Superwall.shared.identify(session.user.id); // Pass the user id to Superwall.
    void Superwall.shared.setUserAttributes(session.user);
  }
  return session?.user ?? null;
};

export const useSignIn = () => {
  const utils = api.useUtils();
  const router = useRouter();

  return async () => {
    await signIn();
    await utils.invalidate();
    router.replace("/");
  };
};

export const useSignOut = () => {
  const utils = api.useUtils();
  const signOut = api.auth.signOut.useMutation();
  const router = useRouter();

  return async () => {
    const res = await signOut.mutateAsync();
    if (!res.success) return;
    await deleteToken();
    await Superwall.shared.reset(); // Reset Superwall user id.
    await utils.invalidate();
    router.replace("/");
  };
};
