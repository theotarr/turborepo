import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { auth } from "@acme/auth";

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  const session = await auth();
  if (!session) return redirect("/login");

  return (
    <div className="flex min-h-screen">
      <SidebarProvider defaultOpen={true}>
        <AppSidebar userId={session?.user.id} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
