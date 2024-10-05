"use server";

import { redirect } from "next/navigation";
import { freePlan, proPlan } from "@/config/subscriptions";
import { countLecturesFromPastMonth } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase";
import { LectureType } from "@prisma/client";

import { auth } from "@acme/auth";

export async function createLecture(
  courseId?: string,
  type: LectureType = "LIVE",
): Promise<string> {
  const session = await auth();
  if (!session) redirect("/login");

  const { data, error } = await supabase
    .from("Lecture")
    .insert({
      type,
      title: "Untitled Lecture",
      userId: session.user.id,
      transcript: [], // For some reason this fixes a bug where transcription does not work on the first try, but works on (manual) page reload.
      courseId: courseId || null,
    })
    .select("id")
    .single();

  if (error)
    throw new Error(
      `There was an error creating the lecture: ${error.message}`,
    );

  return data.id as string;
}

export async function rateLimitLectures() {
  const session = await auth();
  if (!session) redirect("/login");
  const { data: user } = await supabase
    .from("User")
    .select("*")
    .eq("id", session.user.id)
    .single();
  if (!user) redirect("/login");

  const lecturesPastMonth = await countLecturesFromPastMonth(session.user.id);
  const { data: stripePriceId } = await supabase
    .from("User")
    .select("stripePriceId")
    .eq("id", session.user.id)
    .single();

  if (!stripePriceId) redirect("/dashboard/settings");

  // find the user's subscription plan based on the stripePriceId on the user obj
  let monthlyLectureCap = freePlan.messagesPerMonth!;
  if (proPlan.stripePriceIds.includes(user.stripePriceId)) {
    // If the user is on the pro plan.
    monthlyLectureCap = proPlan.messagesPerMonth!;
  }

  if (lecturesPastMonth >= monthlyLectureCap) redirect("/dashboard/settings");
}
