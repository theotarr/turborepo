"use client";

import { MainNav } from "@/components/main-nav";
import { SidebarDesktop } from "@/components/sidebar-desktop";
import { UserAccountNav } from "@/components/user-account-nav";
import { chatConfig } from "@/config/chat";
import { api } from "@/lib/trpc/react";

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { data: session } = api.auth.getSession.useQuery();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav items={chatConfig.mainNav} />
          <div className="flex flex-1 items-center sm:justify-end">
            <div className="ml-4 flex flex-1 justify-center space-x-4 sm:grow-0">
              {session && (
                <UserAccountNav
                  user={{
                    name: session?.user.name,
                    image: session?.user.image,
                    email: session?.user.email,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col overflow-y-hidden">
        <div className="relative flex h-[calc(100vh_-_4.25rem)] overflow-hidden">
          <SidebarDesktop userId={session?.user.id} />
          <div className="group flex w-full flex-col items-center overflow-auto pl-0 duration-300 ease-in-out animate-in peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
