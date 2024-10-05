import Link from "next/link"
import { auth } from "@acme/auth"

import { marketingConfig } from "@/config/marketing"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { Footer } from "@/components/site-footer"
import { UserAccountNav } from "@/components/user-account-nav"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  const session = await auth()
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="container z-40 bg-background">
        <div className="flex h-20 items-center justify-between py-6">
          <MainNav items={marketingConfig.mainNav} />
          <div className="flex flex-1 items-center sm:justify-end">
            <div className="ml-4 flex flex-1 justify-end space-x-4 sm:grow-0">
              {session ? (
                <>
                  <UserAccountNav
                    user={{
                      name: session.user.name,
                      image: session.user.image,
                      email: session.user.email,
                    }}
                  />
                </>
              ) : (
                <nav>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "px-4"
                    )}
                  >
                    Login
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
