import { supabase } from "@/lib/supabase"

export async function countChatMessagesFromPastMonth(userId: string) {
  const { data: lectures } = await supabase
    .from("Lecture")
    .select("id")
    .eq("userId", userId)
  const lectureIds = lectures?.map((l) => l.id) ?? []
  const { count: pastMonthMessageCount } = await supabase
    .from("Message")
    .select("*", { count: "exact", head: true })
    .in("lectureId", lectureIds)
    .gte(
      "updatedAt",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    ) // 30 days ago

  return pastMonthMessageCount || 0
}

export async function countLecturesFromPastMonth(userId: string) {
  const { count: pastMonthLectureCount } = await supabase
    .from("Lecture")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .gte(
      "createdAt",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    ) // 30 days ago

  return pastMonthLectureCount || 0
}
