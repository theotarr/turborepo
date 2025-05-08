import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarHeader } from "@/components/sidebar-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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

  const isCollapsed = cookies().get("sidebar_state")?.value !== "true";

  const subscription = await getUserSubscriptionPlan(session.user?.id);

  return (
    <>
      <div className="flex min-h-screen">
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar />
          <SidebarInset>
            {subscription.stripeSubscriptionId &&
            subscription.stripeCurrentPeriodEnd < new Date().getTime() ? (
              <div className="bg-red-500 px-6 py-2.5 text-center">
                <p className="text-sm font-medium leading-6 text-white">
                  Your subscription has expired,{" "}
                  <a
                    href="/dashboard/settings"
                    className="font-bold hover:underline"
                  >
                    update your payment method
                  </a>{" "}
                  to access your notes.
                </p>
              </div>
            ) : null}
            <SidebarHeader />
            <main className="p-8">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
}
