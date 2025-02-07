import { GeistSans } from "geist/font/sans";

import "@/styles/globals.css";

import { Viewport } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { CSPostHogProvider } from "@/components/posthog";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";
import { TiktokAnalytics } from "@/components/tiktok-analytics";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { auth } from "@acme/auth";

const META_PIXEL_ID = "1646932239239037";
const GA_MEASUREMENT_ID = "G-S4KV1S3P6L";

interface RootLayoutProps {
  children: React.ReactNode;
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata = {
  metadataBase: new URL("https://knownotes.ai"),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "KnowNotes",
    "Know Notes",
    "No Notes",
    "AI",
    "ChatGPT",
    "Note Taking",
    "Transcription",
    "AI Assistant",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

const PostHogPageView = dynamic(
  () => import("../components/posthog-page-view"),
  {
    ssr: false,
  },
);

export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await auth();
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        <meta name="apple-itunes-app" content="app-id=6739503513" />
      </head>
      <TRPCReactProvider>
        <CSPostHogProvider>
          <body
            className={cn(
              "font-geist-sans min-h-screen bg-background antialiased",
            )}
          >
            <PostHogPageView />
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
              <SpeedInsights />
              {process.env.NODE_ENV === "production" && (
                <>
                  {/* PromoteKit */}
                  <Script
                    async
                    src="https://cdn.promotekit.com/promotekit.js"
                    data-promotekit="8b10efa4-4d33-49c2-927f-39fe809a6468"
                  ></Script>
                  {/* Facebook Pixel */}
                  <Script id="facebook-pixel" strategy="afterInteractive">
                    {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
                  </Script>
                  <noscript>
                    <img
                      height="1"
                      width="1"
                      style={{ display: "none" }}
                      src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                    />
                  </noscript>
                  {/* Google Analytics */}
                  <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
                  {/* Vercel Analytics */}
                  <VercelAnalytics />
                  {/* Tiktok Pixel */}
                  <TiktokAnalytics
                    userId={session?.user?.id ?? undefined}
                    email={session?.user?.email ?? undefined}
                  />
                </>
              )}
              <Toaster />
              <TailwindIndicator />
            </ThemeProvider>
          </body>
        </CSPostHogProvider>
      </TRPCReactProvider>
    </html>
  );
}
