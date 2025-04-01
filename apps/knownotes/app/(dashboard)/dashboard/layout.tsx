import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/lib/db";
import { getUserSubscriptionPlan } from "@/lib/subscription";

import { auth } from "@acme/auth";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();
  if (!session) return redirect("/login");

  const subscription = await getUserSubscriptionPlan(session.user?.id);

  // Fetch recent lectures
  const recentLectures = await db.lecture.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // Get user with courses
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      courses: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });

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
      <div className="flex min-h-screen">
        <SidebarProvider>
          <AppSidebar
            user={{
              id: session.user.id,
              name: session.user?.name ?? "",
              image: session.user?.image,
              email: session.user?.email,
              courses: user?.courses,
            }}
            recentLectures={recentLectures}
          />
          <main className="flex-1 overflow-x-hidden p-6">{children}</main>
        </SidebarProvider>
      </div>
      <SiteFooter className="border-t" />
    </>
  );
}
