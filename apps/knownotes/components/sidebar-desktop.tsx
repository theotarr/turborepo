import { SidebarToggle, SidebarWrapper } from "@/components/sidebar";

import { auth } from "@acme/auth";

import { ChatHistory } from "./chat-history";
import { SidebarMobile } from "./sidebar-mobile";

export async function SidebarDesktop() {
  const session = await auth();

  if (!session) {
    return <></>;
  }

  return (
    <>
      <SidebarWrapper className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-background duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
        {/* @ts-ignore */}
        <ChatHistory userId={session.user.id} />
        <SidebarToggle className="absolute -right-16 top-1/2 -translate-y-1/2" />
      </SidebarWrapper>
      <SidebarMobile userId={session.user.id} />
    </>
  );
}
