"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { User } from "@prisma/client";
import { toast } from "sonner";

interface UserDeleteFormProps extends React.HTMLAttributes<HTMLDivElement> {
  user: Pick<User, "id">;
}

export function UserDeleteForm({
  user,
  className,
  ...props
}: UserDeleteFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  async function onSubmit() {
    setIsSaving(true);

    const response = await fetch(`/api/users/${user.id}`, {
      method: "DELETE",
    });

    setIsSaving(false);

    if (!response?.ok) {
      return toast.error(
        "Something went wrong. Your account was not deleted. Please try again.",
      );
    }
    toast.success("Your account has been deleted.");
    router.push("/");
    router.refresh();
  }

  return (
    <div className={cn("grid gap-8", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Account</CardTitle>
          <CardDescription>Manage your account.</CardDescription>
        </CardHeader>
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className={cn(
                  buttonVariants({
                    size: "sm",
                    variant: "secondary",
                  }),
                  className,
                )}
                disabled={isSaving}
              >
                {isSaving && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={() => onSubmit()} variant="destructive">
                    Delete my account
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
