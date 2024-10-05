import { DashboardConfig } from "types"

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
    {
      title: "Affiliate",
      href: "/affiliate",
    },
    // {
    //   title: "About",
    //   href: "/about",
    // },
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
      href: "/dashboard/lectures",
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
}
