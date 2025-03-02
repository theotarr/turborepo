import { redirect } from "next/navigation";

import { auth } from "@acme/auth";

interface LectureLayoutProps {
  children?: React.ReactNode;
}

export default async function LectureLayout({ children }: LectureLayoutProps) {
  const session = await auth();
  if (!session) return redirect("/login");

  return <>{children}</>;
}
