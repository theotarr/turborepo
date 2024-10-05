import Link from "next/link"

import { absoluteUrl } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { PricingSection } from "@/components/pricing"

const title = "Affiliate"
const ogUrl = `${absoluteUrl("")}/api/og?heading=${title}&mode=light`

export const metadata = {
  title,
  openGraph: {
    title,
    url: absoluteUrl("/affiliate"),
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

const steps = [
  {
    title: "Sign up",
    description:
      "Go ahead to sign up on our affiliate program to set up your own personal promotion code.",
  },
  {
    title: "Share your referral link/code",
    description:
      "Share your promotion code with your friends, family, and followers.",
  },
  {
    title: "Get paid",
    description:
      "We'll send you commission via PayPal at the end of every month.",
  },
]

export default function AffiliatePage() {
  return (
    <div>
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:pb-24 lg:pt-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl lg:leading-[1.1]">
            Earn <span className="text-primary/80">$6.50/mo</span> on <br />
            all referrals
          </h1>
          <p className="max-w-xl text-secondary-foreground/80 sm:text-xl sm:leading-8">
            Join our affiliate program and receive a $6.50/mo commission for
            every customer you refer to us!
          </p>
          <div className="mt-2 flex flex-col items-center justify-center">
            <Link
              href="https://affiliates.knownotes.ai/"
              className={buttonVariants({ size: "lg" })}
            >
              Join Now
            </Link>
          </div>
          {/* <div className="mt-16 flow-root sm:mt-24">
            <div className="relative -m-2 rounded-xl bg-primary/5 p-2 ring-1 ring-inset ring-primary/10 lg:-m-4 lg:rounded-2xl lg:p-4">
              <video
                src="/assets/knownotes-demo.mp4"
                width={2432}
                height={1442}
                className="rounded-md shadow-2xl ring-1 ring-primary/10"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div> */}
        </div>
      </section>
      <section
        id="steps"
        className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-6xl lg:leading-[1.1]">
          How it works
        </h2>
        <div className="flex flex-col gap-6 pt-8 md:flex-row">
          {steps.map((step, index) => (
            <div key={index}>
              <div>
                <h3 className="mt-6 font-medium uppercase text-primary">
                  Step {index + 1}
                </h3>
                <p className="mt-1 text-3xl font-semibold leading-tight tracking-tighter text-secondary-foreground">
                  {step.title}
                </p>
                <p className="mt-4 text-lg text-secondary-foreground/70">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section
        id="cta"
        className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-6xl lg:leading-[1.1]">
          Partner with us
        </h2>
        <div className="flex justify-center pt-8">
          <Link href="https://affiliates.knownotes.ai/">
            <Button size="lg">Join us now</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
