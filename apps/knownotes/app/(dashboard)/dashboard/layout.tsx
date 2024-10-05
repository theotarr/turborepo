import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@acme/auth"

import { dashboardConfig } from "@/config/dashboard"
import { getUserSubscriptionPlan } from "@/lib/subscription"
import { StaticAffiliateCard } from "@/components/affiliate-card"
import { MainNav } from "@/components/main-nav"
import { DashboardNav } from "@/components/nav"
import { SiteFooter } from "@/components/site-footer"
import { UserAccountNav } from "@/components/user-account-nav"
import { LectureCommandMenu } from "@/components/command-menu"
import { getLectures } from "@/lib/lecture/actions"

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth()
  if (!session) return redirect("/login")

  const subscription = await getUserSubscriptionPlan(session.user?.id)

  return (
    <>
      {subscription.stripeSubscriptionId &&
      subscription.stripeCurrentPeriodEnd < new Date().getTime() ? (
        <div className="bg-red-500 px-6 py-2.5 text-center">
          <p className="text-sm font-medium leading-6 text-white">
            <Link href="/dashboard/settings">
              Your subscription has expired,{" "}
              <strong className="font-bold">update your payment method</strong>{" "}
              to continue using KnowNotes.
              <span aria-hidden="true" className="ml-2">
                &rarr;
              </span>
            </Link>
          </p>
        </div>
      ) : (
        <></>
      )}
      <div className="flex min-h-screen flex-col space-y-6">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <MainNav items={dashboardConfig.mainNav} />
            <div className="flex flex-1 items-center sm:justify-end">
              <div className="ml-4 flex flex-1 justify-end space-x-4 sm:grow-0">
                <UserAccountNav
                  user={{
                    name: session.user?.name ?? "",
                    image: session.user?.image,
                    email: session.user?.email,
                  }}
                />
              </div>
            </div>
          </div>
        </header>
        <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
          <aside className="relative hidden w-[200px] flex-col md:flex">
            <DashboardNav items={dashboardConfig.sidebarNav} />
            {/* <StaticAffiliateCard className="bottom-0 left-0 w-56" /> */}
          </aside>
          <main className="flex w-full flex-1 flex-col overflow-hidden">
            {children}
          </main>
        </div>
        <SiteFooter className="border-t" />
      </div>
    </>
  )
}
