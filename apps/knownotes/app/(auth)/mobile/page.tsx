import { Icons } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { auth } from "@acme/auth";

export default async function MobileLoginSuccessPage() {
  const session = await auth();
  if (!session) return null;
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Continue in our app
          </h1>
          <p className="text-sm text-muted-foreground">
            Click the button to be redirected to the KnowNotes mobile app.
          </p>
        </div>
        <a
          href={`knownotes://mobile?session_token=${session.sessionToken}`}
          className={cn(buttonVariants(), "flex items-center justify-center")}
        >
          Continue
          <Icons.arrowRight className="ml-2 size-4" aria-hidden="true" />
        </a>{" "}
      </div>
    </div>
  );
}
