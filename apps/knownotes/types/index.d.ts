import type { Icon } from "lucide-react";
import { Icons } from "@/components/icons";
import { User } from "@prisma/client";

export interface Transcript {
  text: string;
  start: number; // Seconds from the beginning of the audio.
  embeddingIds?: string[]; // IDs of the embeddings in the database.
}

export type NavItem = {
  title: string;
  href: string;
  disabled?: boolean;
};

export type MainNavItem = NavItem;

export type SidebarNavItem = {
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
} & (
  | {
      href: string;
      items?: never;
    }
  | {
      href?: string;
      items: NavLink[];
    }
);

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  footer: MainNavItem[];
  socials: {
    title: string;
    href: string;
    icon: keyof typeof Icons;
  }[];
};

export type DocsConfig = {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
};

export type MarketingConfig = {
  mainNav: MainNavItem[];
};

export type DashboardConfig = {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
};

export type AdminConfig = {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
};

export type ChatConfig = {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
};

export type SubscriptionPlan = {
  description: string;
  stripePriceIds: string[];
  appStoreProductIds?: string[];
  lecturesPerMonth?: number;
  messagesPerMonth?: number;
  noteGenerationsPerMonth?: number;
};

export type UserSubscriptionPlan = SubscriptionPlan &
  Pick<
    User,
    "stripeCustomerId" | "stripeSubscriptionId" | "appStoreSubscriptionId"
  > & {
    stripeCurrentPeriodEnd: number;
    appStoreCurrentPeriodEnd: number;
    isPro: boolean;
    isPaused: boolean;
    resumeAt: number | null;
  };
