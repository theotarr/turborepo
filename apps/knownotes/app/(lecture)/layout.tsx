import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@acme/auth";

interface LectureLayoutProps {
  children?: React.ReactNode;
}

export default async function LectureLayout({ children }: LectureLayoutProps) {
  const session = await auth();
  if (!session) return redirect("/login");

  const isCollapsed = cookies().get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
