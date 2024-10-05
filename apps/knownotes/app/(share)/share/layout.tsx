import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LectureShareLayoutProps {
  children?: React.ReactNode;
}

export default async function LectureShareLayout({
  children,
}: LectureShareLayoutProps) {
  return (
    <>
      <div className="fixed top-0 z-10 flex w-screen items-center gap-x-6 bg-secondary px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
        <p className="text-sm leading-6 text-secondary-foreground">
          Notes written with KnowNotes AI
        </p>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-auto w-auto rounded-full px-2.5 py-1",
          )}
        >
          Try now
        </Link>
        <div className="flex flex-1 justify-end"></div>
      </div>
      <main className="mt-16 flex w-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </>
  );
}
