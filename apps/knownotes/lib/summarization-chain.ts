import { ChatOpenAI } from "@langchain/openai"
import { loadSummarizationChain } from "langchain/chains"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

export async function summarizeDocuments(
  text: string,
  summarizationType: "map_reduce" | "refine" | "stuff" = "map_reduce"
): Promise<string> {
  if (text.length === 0) return ""

  // Dynamically set chunk size based on text length to avoid LLM token limits
  let chunkSize
  if (text.length < 10000) chunkSize = 1000
  else if (text.length < 20000) chunkSize = 2000
  else if (text.length < 40000) chunkSize = 3000
  else if (text.length < 80000) chunkSize = 4000
  else chunkSize = 8000

  const llm = new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-4o-mini",
  })
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: 200,
  })
  const docs = await textSplitter.createDocuments([text])

  const chain = loadSummarizationChain(llm, {
    type: summarizationType,
  })

  const res = await chain.invoke({
    input_documents: docs,
  })
  return res.text
}
