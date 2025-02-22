"use client";

import Script from "next/script";
import { env } from "@/env";
import { useMount } from "react-use";
import TiktokPixel from "tiktok-pixel";

import { TIKTOK_PIXEL_ID } from "@acme/analytics";

declare global {
  interface Window {
    dataLayer?: Object[];
  }
}

export function PixelTracking({
  userId,
  email,
}: {
  userId?: string;
  email?: string;
}) {
  useMount(async () => {
    // Push the user id to Google Analytics (the datalayer).
    let hashedUserId: string;

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
        ...(userId
          ? {
              external_id: Buffer.from(
                await crypto.subtle.digest(
                  "SHA-256",
                  new TextEncoder().encode(userId),
                ),
              ).toString("hex"),
            }
          : {}),
        email,
      },
      {
        debug: true,
      },
    );
  });

  return (
    <>
      {/* Facebook Pixel */}
      <Script id="facebook-pixel" strategy="afterInteractive">
        {userId
          ? `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${env.NEXT_PUBLIC_META_PIXEL_ID}', {
            external_id: '${userId}',
          });
          fbq('track', 'PageView');
        `
          : `!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${env.NEXT_PUBLIC_META_PIXEL_ID}');
          fbq('track', 'PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
