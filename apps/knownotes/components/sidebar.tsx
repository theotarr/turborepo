"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { create } from "zustand";

import { Icons } from "./icons";
import { Button } from "./ui/button";

export const useSidebarStore = create<{
  isSidebarOpen: boolean;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  toggleSidebar: () => void;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
}>((set) => ({
  isSidebarOpen: true,
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));

export interface SidebarProps extends React.ComponentProps<"div"> {}

export function SidebarWrapper({ className, children }: SidebarProps) {
  const { isSidebarOpen, isLoading } = useSidebarStore();

  return (
    <div
      data-state={isSidebarOpen && !isLoading ? "open" : "closed"}
      className={cn(className, "h-full flex-col")}
    >
      {children}
    </div>
  );
}

interface SidebarToggleProps extends React.ComponentProps<typeof Button> {}

export function SidebarToggle({ ...props }: SidebarToggleProps) {
  const { toggleSidebar, isSidebarOpen } = useSidebarStore();

  return (
    <TooltipProvider delayDuration={5}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn("-ml-2 hidden p-0 lg:flex", props.className)}
            onClick={() => {
              toggleSidebar();
            }}
            {...props}
          >
            {isSidebarOpen ? (
              <Icons.chevronLeft className="size-6" />
            ) : (
              <Icons.chevronRight className="size-6" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{isSidebarOpen ? "Close" : "Open"} Sidebar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SidebarToggleMobile({ ...props }: SidebarToggleProps) {
  const { toggleSidebar } = useSidebarStore();

  return (
    <TooltipProvider delayDuration={5}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn("-ml-2 hidden p-0 lg:flex", props.className)}
            onClick={() => {
              toggleSidebar();
            }}
            {...props}
          >
            <Icons.chevronRight className="size-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Open Sidebar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
