"use client";

import { useRouter } from "next/navigation";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useWindowSize } from "@uidotdev/usehooks";

import { Icons } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function SidebarHeader() {
  const router = useRouter();
  const { open } = useSidebar();
  const { width } = useWindowSize();

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />
      {(!open || width! < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-8 md:w-8 md:px-2"
              onClick={() => {
                // Navigate to the chat page which has the course selector
                router.push("/dashboard");
              }}
            >
              <Icons.add className="size-4" />
              <span className="ml-2 truncate md:sr-only">Add Content</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Content</TooltipContent>
        </Tooltip>
      )}
    </header>
  );
}
