import * as React from "react";
import { Icons } from "@/components/icons";
import { ModeToggle } from "@/components/mode-toggle";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteFooter({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn(className)}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Icons.logo />
          <p className="text-center text-sm leading-loose md:text-left">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
        <ModeToggle />
      </div>
    </footer>
  );
}

export function Footer({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <footer className={cn(className)}>
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
        <nav
          className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12"
          aria-label="Footer"
        >
          {siteConfig.footer.map((item) => (
            <div key={item.title} className="pb-6">
              <a
                href={item.href}
                className="text-sm leading-6 text-secondary-foreground hover:text-secondary-foreground/90"
              >
                {item.title}
              </a>
            </div>
          ))}
        </nav>
        <div className="mt-10 flex justify-center space-x-10">
          {siteConfig.socials.map((item) => {
            const Icon = Icons[item.icon];
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                className="text-secondary-foreground/70 hover:text-secondary-foreground/60"
              >
                <span className="sr-only">{item.title}</span>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </a>
            );
          })}
        </div>
        <p className="mt-10 text-center text-xs leading-5">
          &copy; {new Date().getFullYear()} KnowNotes. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
