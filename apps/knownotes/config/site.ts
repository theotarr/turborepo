import { SiteConfig } from "types"

export const siteConfig: SiteConfig = {
  name: "KnowNotes",
  description:
    "KnowNotes uses AI and listens to your lectures to take notes and answer questions for you.",
  url: "https://knownotes.ai",
  ogImage:
    "https://knownotes.ai/api/og?title=KnowNotes&mode=light&heading=Home",
  footer: [
    {
      title: "Affiliate",
      href: "/affiliate",
    },
    {
      title: "About",
      href: "/about",
    },
    // {
    //   title: "Blog",
    //   href: "/blog",
    // },
    // {
    //   title: "Pricing",
    //   href: "/pricing",
    // },
    {
      title: "Terms",
      href: "/terms",
    },
    {
      title: "Privacy",
      href: "/privacy",
    },
    {
      title: "Support",
      href: "mailto:support@knownotes.ai",
    },
  ],
  socials: [
    {
      title: "Discord",
      href: "https://discord.gg/knownotes",
      icon: "discord",
    },
    {
      title: "Instagram",
      href: "https://instagram.com/knownotes.ai/",
      icon: "instagram",
    },
    {
      title: "Tiktok",
      href: "https://tiktok.com/@knownotesai",
      icon: "tiktok",
    },
    // {
    //   title: "Twitter",
    //   href: "https://twitter.com/knownotesai",
    //   icon: "twitter",
    // },
  ],
}
