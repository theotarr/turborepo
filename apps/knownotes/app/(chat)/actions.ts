"use server";

import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Chat } from "@prisma/client";

import { auth } from "@acme/auth";

export async function getChats(userId: string) {
  const session = await auth();
  if (!session) return redirect("/login");

  try {
    const { data: chats, error } = await supabase
      .from("Chat")
      .select(
        `
        *,
        course:courseId (
          id,
          name
        )
      `,
      )
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      throw new Error("There was an error fetching the chats.");
    }

    // Group the chats in a nested array by course (if a chat doesn't have a course, it will be grouped in the last array)
    const chatsByCourse = chats.reduce(
      (acc, chat) => {
        const course = chat.course?.name;
        if (!acc[course]) {
          acc[course] = [];
        }
        acc[course].push(chat);
        return acc;
      },
      {} as Record<string, Chat[]>,
    );
    return chatsByCourse;
  } catch (error) {
    return [];
  }
}

// export async function createChat(
//   courseId: string,
//   chatName: string
// ): Promise<Chat> {
//   const session = await auth()
//   if (!session) return redirect("/login")

//   try {
//     const { data: chat, error } = await supabase
//       .from("Chat")
//       .insert([
//         {
//           name: chatName,
//           courseId,
//           userId: session.user.id,
//         },
//       ])
//       .single()

//     if (error) {
//       throw new Error("There was an error creating the chat.")
//     }

//     return chat
//   } catch (error) {
//     throw new Error("There was an error creating the chat.")
//   }
// }

// export async function updateChat(chatId: string, data: Partial<Chat>) {
//   const session = await auth()
//   if (!session) return redirect("/login")

//   try {
//     const { data: chat, error } = await supabase
//       .from("Chat")
//       .update(data)
//       .eq("id", chatId)
//       .eq("userId", session.user.id)

//     if (error) {
//       throw new Error("There was an error updating the chat.")
//     }

//     return chat
//   } catch (error) {
//     return null
//   }
// }
