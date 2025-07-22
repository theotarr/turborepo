import { GeistSans } from "geist/font/sans";

import "@/styles/globals.css";

import { Viewport } from "next";
import dynamic from "next/dynamic";
import { PaymentDialog } from "@/components/payment-dialog";
import { PixelTracking } from "@/components/pixel-tracking";
import { CSPostHogProvider } from "@/components/posthog";
// import { ReactivateSubscriptionDialog } from "@/components/reactivate-subscription-dialog";
import { ResumeSubscriptionDialog } from "@/components/resume-subscription-dialog";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { TRPCReactProvider } from "@/lib/trpc/react";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { GA_MEASUREMENT_ID } from "@acme/analytics";
import { auth } from "@acme/auth";

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
                  {/* Google Analytics */}
                  <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
                  {/* Vercel Analytics */}
                  <VercelAnalytics />
                  {/* Pixel Tracking (Tiktok, Facebook, etc.) */}
                  <PixelTracking
                    userId={session?.user?.id ?? undefined}
                    email={session?.user?.email ?? undefined}
                  />
                </>
              )}
              <Toaster />
              <TailwindIndicator />
              <PaymentDialog />
              <ResumeSubscriptionDialog />
              {/* <ReactivateSubscriptionDialog /> */}
            </ThemeProvider>
          </body>
        </CSPostHogProvider>
      </TRPCReactProvider>
    </html>
  );
}
