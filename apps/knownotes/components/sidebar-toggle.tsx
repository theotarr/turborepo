import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Icons } from "./icons";
import { Button } from "./ui/button";

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={toggleSidebar}
          variant="outline"
          className="md:h-fit md:px-2"
        >
          <Icons.sidebar className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">
        Toggle Sidebar{" "}
        <span className="ml-1 space-x-2 text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 py-0.5 text-xs font-medium text-muted-foreground">
            ⌘
          </kbd>
          <kbd className="rounded border bg-muted px-1 py-0.5 text-xs font-medium text-muted-foreground">
            B
          </kbd>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
