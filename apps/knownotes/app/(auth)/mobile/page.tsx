import { cookies } from "next/headers";
import { Icons } from "@/components/icons";
import { MobileButton } from "@/components/mobile-button";

export default function MobileLoginSuccessPage() {
  const sessionToken = cookies().get("authjs.session-token")?.value;
  console.log({ sessionToken });
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.logo className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Continue in our app
          </h1>
          <p className="text-sm text-muted-foreground">
            Click the button to continue to the KnowNotes mobile app.
          </p>
        </div>
        <MobileButton sessionToken={sessionToken} />
      </div>
    </div>
  );
}
