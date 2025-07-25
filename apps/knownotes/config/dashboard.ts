import { DashboardConfig } from "types";

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Chat",
      href: "/chat",
    },
  ],
  sidebarNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "home",
    },
    {
      title: "Chat",
      href: "/chat",
      icon: "squarePen",
    },
    {
      title: "Lectures",
      href: "/library?tab=notes",
      icon: "lecture",
    },
    // {
    //   title: "Billing",
    //   href: "/dashboard/billing",
    //   icon: "billing",
    // },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: "settings",
    },
  ],
};
