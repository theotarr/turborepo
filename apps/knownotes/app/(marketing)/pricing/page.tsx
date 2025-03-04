import { redirect } from "next/navigation";
import { absoluteUrl } from "@/lib/utils";

const title = "Pricing";
const description = "Affordable and predictable pricing.";
const ogUrl = `${absoluteUrl("")}/api/og?heading=${title}&mode=light`;

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
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
    description,
    images: [ogUrl],
  },
};

export default function PricingPage() {
  return redirect("/#pricing");
}
