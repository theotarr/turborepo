import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@acme/auth";

interface LibraryLayoutProps {
  children?: React.ReactNode;
}

export default async function LibraryLayout({ children }: LibraryLayoutProps) {
  const session = await auth();
  if (!session) return redirect("/login");

  return (
    <div className="flex min-h-screen">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
