import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import type { Transcript } from "@acme/validators";

const embeddings = new OpenAIEmbeddings();

// eslint-disable-next-line turbo/no-undeclared-env-vars
const privateKey = process.env.SUPABASE_PRIVATE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);
// eslint-disable-next-line turbo/no-undeclared-env-vars
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

export const supabase = createClient(url, privateKey);
export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "Document",
  queryName: "match_documents",
});

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 100;
export const K_DOCUMENTS = 5;

export async function embedTranscripts(
  transcripts: Transcript[],
  lectureId: string,
  courseId?: string,
): Promise<string[]> {
  const text = transcripts.map((t) => t.text).join("\n");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  // Split the text into chunks preserving metadata.
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent: text,
      metadata: {
        lectureId,
        courseId,
      },
    }),
  ]);
  console.log(`Adding ${docs.length} documents to vector store`);

  try {
    return await vectorStore.addDocuments(docs);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Error adding documents to vector store: ${error}`);
  }
}

export function shouldEmbedTranscripts(transcripts: Transcript[]): boolean {
  // We don't want to embed transcripts that are too short (ie. less than half the chunk size)
  const text = transcripts.map((t) => t.text).join("\n");
  return text.length > CHUNK_SIZE / 2;
}

// Override the default SupabaseVectorStore to add the document id to the metadata and use that exact id later
SupabaseVectorStore.prototype.addVectors = async function (
  vectors: number[][],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: any[],
): Promise<string[]> {
  const ids: string[] = [];

  const rows = vectors.map((embedding, idx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const metadata = documents[idx].metadata;
    return {
      embedding,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      metadata,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      lectureId: documents[idx].metadata.lectureId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      courseId: documents[idx].metadata.courseId || null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      content: documents[idx].pageContent,
    };
  }); // upsert returns 500/502/504 (yes really any of them) if given too many rows/characters
  // ~2000 trips it, but my data is probably smaller than average pageContent and metadata
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);

    const res = await this.client
      .from(this.tableName)
      .insert(chunk)
      .select("id");
    if (res.error) {
      console.log(chunk[chunk.length - 1]);
      throw new Error(
        `Error inserting: ${res.error.message} ${res.status} ${res.statusText}`,
      );
    }

    ids.push(...res.data.map((row: { id: string }) => row.id));
  }

  return ids;
};
