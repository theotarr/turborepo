import { notFound } from "next/navigation";
import { allColleges } from "contentlayer/generated";

import "@/styles/mdx.css";

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AmericanLogo from "@/assets/images/institutions/american.png";
import BerkelyLogo from "@/assets/images/institutions/berkeley.png";
import HarvardLogo from "@/assets/images/institutions/harvard.png";
import McGillLogo from "@/assets/images/institutions/mcgill.png";
import MITLogo from "@/assets/images/institutions/mit.png";
import NYULogo from "@/assets/images/institutions/nyu.png";
import PrincetonLogo from "@/assets/images/institutions/princeton.png";
import StanfordLogo from "@/assets/images/institutions/stanford.png";
import YaleLogo from "@/assets/images/institutions/yale.png";
import { FaqArray } from "@/components/faq";
import { PrimaryFeatures } from "@/components/features";
import { PricingCard } from "@/components/pricing";
import { ReviewGrid } from "@/components/testimonials";
import { TrustPilot } from "@/components/trust-pilot";
import { Button, buttonVariants } from "@/components/ui/button";
import { InfiniteMovingCards } from "@/components/ui/infinite-scroll";
import { env } from "@/env";
import { absoluteUrl, cn } from "@/lib/utils";

const institutionImages = [
  <Image
    src={HarvardLogo}
    height={64}
    alt={"Harvard College"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={MITLogo}
    height={64}
    alt={"MIT"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={StanfordLogo}
    height={64}
    alt={"Stanford University"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={McGillLogo}
    height={64}
    alt={"McGill University"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={YaleLogo}
    height={64}
    alt={"Yale"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={BerkelyLogo}
    height={64}
    alt={"UC Berkely"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={PrincetonLogo}
    height={64}
    alt={"Princeton University"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={NYULogo}
    height={64}
    alt={"NYU"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
  <Image
    src={AmericanLogo}
    height={64}
    alt={"American University"}
    style={{
      maxWidth: "100%",
      height: "auto",
    }}
  />,
];

interface CollegePageProps {
  params: {
    slug: string[];
  };
}

async function getCollegeFromParams(params) {
  const slug = params?.slug?.join("/");
  const college = allColleges.find((post) => post.slugAsParams === slug);

  if (!college) {
    null;
  }

  return college;
}

export async function generateMetadata({
  params,
}: CollegePageProps): Promise<Metadata> {
  const college = await getCollegeFromParams(params);

  if (!college) {
    return {};
  }

  const url = env.NEXT_PUBLIC_APP_URL;

  const ogUrl = new URL(`${url}/api/og`);
  ogUrl.searchParams.set("heading", college.title);
  ogUrl.searchParams.set("type", "College");
  ogUrl.searchParams.set("mode", "light");

  const title = `KnowNotes x ${college.title}`;
  const description = `KnowNotes x ${college.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: absoluteUrl(college.slug),
      images: [
        {
          url: ogUrl.toString(),
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
      images: [ogUrl.toString()],
    },
  };
}

export async function generateStaticParams(): Promise<
  CollegePageProps["params"][]
> {
  return allColleges.map((post) => ({
    slug: post.slugAsParams.split("/"),
  }));
}

export default async function CollegePage({ params }: CollegePageProps) {
  const college = await getCollegeFromParams(params);

  if (!college) {
    notFound();
  }

  return (
    <>
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:pb-20 lg:pt-24">
        <TrustPilot />
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl lg:leading-[1.1]">
            KnowNotes x {college.title}
          </h1>
          <p className="max-w-lg leading-normal text-muted-foreground sm:max-w-xl sm:text-xl sm:leading-relaxed">
            KnowNotes transcribes lectures and creates detailed notes,
            flashcards, and quizzes so you can ace your classes easily.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg", variant: "shadow" }),
                "h-12 w-56 rounded-lg text-base font-semibold",
              )}
            >
              Get Started
            </Link>
          </div>
          <div className="relative mt-12 flex flex-col items-center justify-center sm:mt-16">
            <p className="text-secondary-foreground/8 text-lg font-bold uppercase sm:text-xl">
              Loved by <span className="text-primary/80">10k+ students</span> at
            </p>
            <div className="mt-4 flex w-screen flex-col items-center justify-center overflow-hidden bg-primary/5 antialiased dark:bg-transparent">
              <InfiniteMovingCards
                direction="right"
                speed="slow"
                pauseOnHover={false}
                items={institutionImages}
              />
            </div>
          </div>
          {/* <div className="mt-10 flow-root sm:mt-24">
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
        id="features"
        className="container space-y-12 py-8 dark:bg-transparent md:py-8 lg:py-12"
      >
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-6xl lg:leading-[1.1]">
          How it works
        </h2>
        <PrimaryFeatures />
        {/* <FeatureGrid className="mx-auto max-w-5xl" /> */}
      </section>
      <section
        id="testimonials"
        className="container space-y-12 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <h2 className="mx-auto mb-10 max-w-2xl text-center text-3xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-6xl lg:leading-[1.1]">
          Testimonials
        </h2>
        <div className="flex flex-col items-center justify-center">
          <ReviewGrid />
        </div>
      </section>
      <section
        id="pricing"
        className="container space-y-12 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <h2 className="mx-auto mb-10 max-w-2xl text-center text-3xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-6xl lg:leading-[1.1]">
          Pricing
        </h2>
        <PricingCard className="mx-auto max-w-5xl" />
      </section>
      <section
        id="faq"
        className="container space-y-12 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <h2 className="mx-auto mb-10 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-6xl lg:leading-[1.1]">
          Frequently asked questions
        </h2>
        <FaqArray />
      </section>
      <section
        id="cta"
        className="container space-y-4 py-8 dark:bg-transparent md:py-12 lg:py-24"
      >
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold leading-tight tracking-tighter sm:text-3xl md:text-6xl lg:leading-[1.1]">
          Ready for no notes?
        </h2>
        <p className="mx-auto max-w-lg text-center leading-normal text-muted-foreground sm:text-xl sm:leading-relaxed">
          Get your personalized AI assistant with KnowNotes today and never
          stress about taking notes and studying again.
        </p>
        <div className="flex justify-center pt-6">
          <Link href="/register">
            <Button
              variant="shadow"
              className="h-14 w-72 rounded-lg text-xl font-semibold"
            >
              Get started{" "}
              <span className="ml-2 text-lg font-medium text-primary-foreground/80">
                -- it&apos;s free
              </span>
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
