import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ChatHistory } from "./chat-history";
import { SidebarToggleMobile, SidebarWrapper } from "./sidebar";

export function SidebarMobile({ userId }: { userId: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild className="md:hidden">
        <SidebarToggleMobile className="absolute top-1/2 z-10 ml-4 -translate-y-1/2 rounded-full bg-secondary/75 p-1 px-2" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="inset-y-0 flex h-auto w-[300px] flex-col p-0 lg:hidden"
      >
        <SidebarWrapper className="flex pt-6">
          <ChatHistory />
        </SidebarWrapper>
      </SheetContent>
    </Sheet>
  );
}
