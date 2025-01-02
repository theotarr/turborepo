import React, { useEffect } from "react";
import { useGlobalSearchParams, useRouter } from "expo-router";

import { setToken } from "~/utils/session-store";

export default function DeepLinkAuth() {
  const router = useRouter();
  const searchParams = useGlobalSearchParams<{ session_token?: string }>();
  const sessionToken = searchParams.session_token ?? null;

  useEffect(() => {
    if (!sessionToken) return;

    setToken(sessionToken);
    router.replace("/(dashboard)/dashboard");
  }, [router, sessionToken]);

  return <></>;
}
