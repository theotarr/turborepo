import { Transcript } from "@/types"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { Document } from "@langchain/core/documents"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import { vectorStore } from "./supabase"

export const CHUNK_SIZE = 1000
export const CHUNK_OVERLAP = 100
export const K_DOCUMENTS = 5

export async function embedTranscripts(
  transcripts: Transcript[],
  lectureId: string,
  courseId?: string
): Promise<string[]> {
  const text = transcripts.map((t) => t.text).join("\n")
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  })

  const docs = await splitter.splitDocuments([
    // Split the text into chunks preserving metadata
    new Document({
      pageContent: text,
      metadata: {
        lectureId,
        courseId,
      },
    }),
  ])

  console.log(`Adding ${docs.length} documents to vector store`)

  try {
    const documentIds = await vectorStore.addDocuments(docs)
    return documentIds
  } catch (e) {
    throw new Error(`Error adding documents to vector store: ${e.message}`)
  }
}

export function shouldEmbedTranscripts(transcripts: Transcript[]): boolean {
  // We don't want to embed transcripts that are too short (ie. less than half the chunk size)
  const text = transcripts.map((t) => t.text).join("\n")
  return text.length > CHUNK_SIZE / 2
}

// Override the default SupabaseVectorStore to add the document id to the metadata and use that exact id later
SupabaseVectorStore.prototype.addVectors = async function (
  vectors: number[][],
  documents: any[]
): Promise<string[]> {
  const ids: string[] = []

  const rows = vectors.map((embedding, idx) => {
    const metadata = documents[idx].metadata
    return {
      embedding,
      metadata,
      lectureId: documents[idx].metadata.lectureId,
      courseId: documents[idx].metadata.courseId || null,
      content: documents[idx].pageContent,
    }
  }) // upsert returns 500/502/504 (yes really any of them) if given too many rows/characters
  // ~2000 trips it, but my data is probably smaller than average pageContent and metadata
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)

    const res = await this.client
      .from(this.tableName)
      .insert(chunk)
      .select("id")
    if (res.error) {
      console.log(chunk[chunk.length - 1])
      throw new Error(
        `Error inserting: ${res.error.message} ${res.status} ${res.statusText}`
      )
    }

    if (res.data) {
      ids.push(...res.data.map((row: { id: string }) => row.id))
    }
  }

  return ids
}
const MySupabaseVectorStore = SupabaseVectorStore
