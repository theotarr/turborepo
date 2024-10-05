"use server";

import { auth } from "@acme/auth";

import { supabase } from "../supabase";

export async function getLectures() {
  const session = await auth();
  if (!session) throw new Error("User not found.");

  const { data, error } = await supabase
    .from("Lecture")
    .select("*")
    .eq("userId", session.user.id);

  if (error) {
    console.error("Error getting lectures:", error);
    throw error;
  }

  return data;
}

export async function updateLecture({
  lectureId,
  title,
  notes,
  enhancedNotes,
  markdownNotes,
}: {
  lectureId: string;
  title?: string | undefined;
  notes?: string | undefined;
  enhancedNotes?: string | undefined;
}) {
  const session = await auth();
  if (!session) throw new Error("User not found.");

  const updateData = {};
  if (title) updateData["title"] = title;
  if (notes) updateData["notes"] = JSON.parse(notes);
  if (enhancedNotes) updateData["enhancedNotes"] = JSON.parse(enhancedNotes);

  const { data, error } = await supabase
    .from("Lecture")
    .update(updateData)
    .eq("id", lectureId)
    .eq("userId", session.user.id);

  if (error) {
    console.error("Error updating lecture:", error);
    throw error;
  }

  return data;
}

export async function deleteLecture(lectureId: string) {
  const session = await auth();
  if (!session) throw new Error("User not found.");

  const { error } = await supabase
    .from("Lecture")
    .delete()
    .eq("id", lectureId)
    .eq("userId", session.user.id);

  if (error) {
    console.error("Error deleting lecture:", error);
    throw error;
  }
}

export async function verifyCurrentUserHasAccessToLecture(lectureId: string) {
  const session = await auth();
  const { data, error } = await supabase
    .from("lecture")
    .select("id")
    .eq("id", lectureId)
    .eq("userId", session?.user.id);

  if (error) {
    throw new Error(
      "There was an error verifying the user access to the lecture.",
    );
  }

  const count = data?.length || 0;

  return count > 0;
}

export async function verifyCurrentUserHasAccessToCourse(courseId: string) {
  const session = await auth();
  const { data, error } = await supabase
    .from("Course")
    .select("id")
    .eq("id", courseId)
    .eq("userId", session?.user.id);

  if (error) {
    throw new Error(
      "There was an error verifying the user access to the course.",
    );
  }

  const count = data?.length || 0;

  return count > 0;
}

export async function searchLectures(query: string) {
  const session = await auth();
  if (!session) throw new Error("User not found.");

  const { data, error } = await supabase
    .from("Lecture")
    .select("*")
    .textSearch("title", query)
    .eq("userId", session.user.id);

  if (error) {
    console.error("Error searching lectures:", error);
    throw error;
  }

  return data;
}
