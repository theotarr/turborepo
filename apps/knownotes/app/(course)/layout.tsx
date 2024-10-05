import { redirect } from "next/navigation"
import { auth } from "@acme/auth"

import { dashboardConfig } from "@/config/dashboard"
import { MainNav } from "@/components/main-nav"
import { DashboardNav } from "@/components/nav"
import { SiteFooter } from "@/components/site-footer"
import { UserAccountNav } from "@/components/user-account-nav"

interface CourseLayoutProps {
  children?: React.ReactNode
}

export default async function CourseLayout({ children }: CourseLayoutProps) {
  const session = await auth()
  if (!session) return redirect("/login")

  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav items={dashboardConfig.mainNav} />
          <div className="flex flex-1 items-center sm:justify-end">
            <div className="ml-4 flex flex-1 justify-center space-x-4 sm:grow-0">
              <UserAccountNav
                user={{
                  name: session.user.name,
                  image: session.user.image,
                  email: session.user.email,
                }}
              />
            </div>
          </div>
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <DashboardNav items={dashboardConfig.sidebarNav} />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
      <SiteFooter className="border-t" />
    </div>
  )
}
