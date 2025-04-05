"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { ChatHistory } from "./chat-history";
import { Icons } from "./icons";

export function AppSidebar({ userId }: { userId: string }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between">
            <Link
              href="/dashboard"
              onClick={() => setOpenMobile(false)}
              className="flex flex-row items-center gap-3"
            >
              <Icons.logo className="size-6" />
              <span className="cursor-pointer rounded-md px-2 text-lg font-semibold hover:bg-muted">
                KnowNotes
              </span>
            </Link>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ChatHistory />
      </SidebarContent>
      <SidebarFooter className="p-2">
        {/* User navigation would go here */}
      </SidebarFooter>
    </Sidebar>
  );
}
