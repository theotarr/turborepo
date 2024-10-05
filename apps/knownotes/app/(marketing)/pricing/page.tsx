import { absoluteUrl } from "@/lib/utils"
import { PricingSection } from "@/components/pricing"

const title = "Pricing"
const ogUrl = `${absoluteUrl("")}/api/og?heading=${title}&mode=light`

export const metadata = {
  title,
  openGraph: {
    title,
    url: absoluteUrl("/pricing"),
    images: [
      {
        url: ogUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    images: [ogUrl],
  },
}

export default function PricingPage() {
  return <PricingSection />
}
