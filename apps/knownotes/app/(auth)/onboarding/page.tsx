import { redirect } from "next/navigation";
import { Onboarding } from "@/components/onboarding-flow";
import { db } from "@/lib/db";

import { auth } from "@acme/auth";

export const metadata = {
  title: "Welcome to KnowNotes!",
  description:
    "Thanks for joining us! We'd love to hear about your needs and how we can help you.",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) return redirect("/login");

  const courses = await db.course.findMany({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="lg:p-8">
        <Onboarding courses={courses} />
      </div>
    </div>
  );
}
