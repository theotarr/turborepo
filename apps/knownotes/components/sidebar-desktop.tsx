import { SidebarToggle, SidebarWrapper } from "@/components/sidebar";

import { ChatHistory } from "./chat-history";
import { SidebarMobile } from "./sidebar-mobile";

export function SidebarDesktop({ userId }: { userId: string }) {
  return (
    <>
      <SidebarWrapper className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-background duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
        <ChatHistory />
        <SidebarToggle className="absolute -right-16 top-1/2 -translate-y-1/2" />
      </SidebarWrapper>
      <SidebarMobile userId={userId} />
    </>
  );
}
