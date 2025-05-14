"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { absoluteUrl, cn } from "@/lib/utils";
import { User } from "next-auth";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";

import { Icons } from "./icons";

interface UserAccountNavProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "name" | "image" | "email">;
  showFullInfo?: boolean;
  className?: string;
}

export function UserAccountNav({
  user,
  showFullInfo = false,
  className,
  ...props
}: UserAccountNavProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn("focus:outline-none", className)}
        asChild
      >
        <div
          className={cn(
            "flex items-center gap-2 transition-colors",
            showFullInfo && "rounded-lg px-2 py-1.5 hover:bg-muted",
          )}
          {...props}
        >
          <UserAvatar
            user={{ name: user.name || null, image: user.image || null }}
            className="h-8 w-8"
          />
          {showFullInfo && (
            <div className="flex flex-col text-left">
              {user.name && (
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
              )}
              {user.email && (
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/library">Library</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Theme Selection */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Icons.sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Icons.moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Icons.laptop className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={(event) => {
            event.preventDefault();
            signOut({
              redirectTo: absoluteUrl("/login"),
            });
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
