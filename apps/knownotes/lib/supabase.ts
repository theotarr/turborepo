import { env } from "@/env";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

const embeddings = new OpenAIEmbeddings();

const privateKey = env.SUPABASE_PRIVATE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_PRIVATE_KEY`);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

export const supabase = createClient(url, privateKey);
export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "Document",
  queryName: "match_documents",
});
