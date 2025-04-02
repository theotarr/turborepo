import Link from "next/link";
import { Icons } from "@/components/icons";
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
      <div className="fixed top-0 z-10 flex w-full items-center justify-between gap-x-6 bg-secondary p-3.5">
        <div className="flex items-center space-x-6">
          <Link href="/?ref=share" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-semibold tracking-tight text-secondary-foreground">
              KnowNotes
            </span>
          </Link>
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            The AI assistant for stressed students
          </p>
        </div>
        <div className="flex flex-1 justify-end">
          <Link
            href="/register?ref=share"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-auto w-auto rounded-full px-2.5 py-1",
            )}
          >
            Try KnowNotes Free
          </Link>
        </div>
      </div>
      <main className="mt-16 flex w-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </>
  );
}
