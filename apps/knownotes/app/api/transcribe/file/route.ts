import fs from "fs"
import { auth } from "@acme/auth"
import { Transcript } from "@/types"
import { createClient } from "@deepgram/sdk"

import { env } from "@/env"
import { db } from "@/lib/db"
import { embedTranscripts } from "@/lib/embeddings"
import { supabase } from "@/lib/supabase"

export const maxDuration = 300 // 5 minutes

const deepgram = createClient(env.DEEPGRAM_API_KEY)

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return new Response("Unauthorized", { status: 403 })

  const formData = await req.formData()
  const fileId = formData.get("fileId") as string
  const courseId = (formData.get("courseId") as string | undefined) ?? undefined

  if (!fileId) return new Response("No file ID provided", { status: 400 })

  if (courseId) {
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
    })
    if (!course || course.userId !== session.user.id)
      return new Response("Course not found", { status: 404 })
  }

  // Download the file from the storage bucket.
  const { data, error } = await supabase.storage
    .from("audio")
    .download(`${session.user.id}/${fileId}`)

  if (error) {
    console.error(error)
    // Delete the file from the storage bucket if it failed to download.
    // Make the user try again.
    const { error: removeFileError } = await supabase.storage
      .from("audio")
      .remove([`${session.user.id}/${fileId}`])
    if (removeFileError) console.error(removeFileError)

    return new Response("Failed to download file", { status: 500 })
  }

  // Data is a Blob, so we need to convert it to a File.
  // Assume the file size is not too large since there is a bucket size limit.
  const blob = data as Blob
  const buffer = Buffer.from(await blob.arrayBuffer())
  const filePath =
    process.env.NODE_ENV === "development"
      ? `${process.cwd()}/${fileId}`
      : `/tmp/${fileId}`
  await fs.promises.writeFile(filePath, buffer)

  let transcript: Transcript[] = []

  try {
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(filePath),
      {
        model: "nova-2",
        punctuate: true,
        smart_formatting: true,
        paragraphs: true,
        tag: ["knownotes-file-upload"],
      }
    )
    if (error) throw new Error(error.message)

    transcript =
      result.results.channels[0].alternatives[0].paragraphs?.paragraphs?.map(
        (p) => {
          const paragraphText = p.sentences?.map((s) => s.text).join(" ")
          return {
            start: p.start,
            text: paragraphText,
          }
        }
      ) ?? []
  } catch (error) {
    console.error(error)
  }

  fs.unlink(filePath, () => {}) // Delete the audio file after the transcription is done.
  const { error: removeFileError } = await supabase.storage
    .from("audio")
    .remove([`${session.user.id}/${fileId}`])
  if (removeFileError) console.error(removeFileError)

  const lecture = await db.lecture.create({
    data: {
      type: "AUDIO_FILE",
      title: "Untitled Lecture", // TODO: Generate a lecture name based on the notes/lecture content.
      transcript: transcript as any,
      userId: session.user.id,
      courseId: courseId ? courseId : undefined,
    },
  })

  // Embed the transcript.
  await embedTranscripts(transcript, lecture.id, courseId)

  // Update the lecture with the transcript embedding document ids
  await db.lecture.update({
    where: {
      id: lecture.id,
    },
    data: {
      transcript: transcript as any,
    },
  })

  if (!lecture) return new Response("Failed to create lecture", { status: 500 })

  return new Response(JSON.stringify({ id: lecture.id }))
}
