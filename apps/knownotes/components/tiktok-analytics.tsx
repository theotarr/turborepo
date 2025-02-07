"use client";

import { useMount } from "react-use";
import TiktokPixel from "tiktok-pixel";

declare global {
  interface Window {
    dataLayer?: Object[];
  }
}

const TIKTOK_PIXEL_ID = "COH8383C77UC70DIPSOG";

export function TiktokAnalytics({
  userId,
  email,
}: {
  userId?: string;
  email?: string;
}) {
  useMount(() => {
    // push the user id to google analytics (the datalayer)
    if (userId) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "login",
        userId,
      });
    }

    // Initialize Tiktok Pixel
    TiktokPixel.init(
      TIKTOK_PIXEL_ID,
      {
        email,
      },
      {
        debug: true,
      },
    );
  });
  return <></>;
}
