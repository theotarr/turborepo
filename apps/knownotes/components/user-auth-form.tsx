"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { registeredInPastMinute } from "@/app/(auth)/actions";
import { Icons } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { userAuthSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import TiktokPixel from "tiktok-pixel";
import * as z from "zod";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const searchParams = useSearchParams();
  console.log({ searchParams });
  const isExpoSignIn = searchParams.get("expo-redirect");
  console.log({ isExpoSignIn });

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      if (await registeredInPastMinute()) {
        TiktokPixel.track("CompleteRegistration", {});
      }
      await signIn("resend", {
        email: data.email.toLowerCase(),
        redirect: false,
        callbackUrl: isExpoSignIn ?? "/onboarding",
      });
    } catch (error) {
      // If the error is a TypeError, ignore it
      if (error instanceof TypeError) {
      } else {
        console.error({ error });
        setIsLoading(false);
        return toast.error("Something went wrong. Please try again.");
      }
    }

    setIsLoading(false);
    return toast.success(
      "Check your email, we sent you a login link. Be sure to check your spam too.",
    );
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>
          <button className={cn(buttonVariants())} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In with Email
          </button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={async () => {
          const isNewUser = await registeredInPastMinute();
          if (isNewUser) {
            TiktokPixel.track("CompleteRegistration", {});
          }
          await signIn("google", {
            callbackUrl: "/onboarding",
          });
        }}
        type="button"
        disabled={isLoading}
      >
        {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
    </div>
  );
}
