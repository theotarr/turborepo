import { CallbackManager } from "langchain/callbacks"
import { LLMChain } from "langchain/chains"
import { ChatOpenAI } from "langchain/chat_models/openai"
import { BufferMemory } from "langchain/memory"
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts"

import { env } from "@/env"

const OBJECTIVE_SYSTEM_THOUGHT = new PromptTemplate({
  inputVariables: ["transcript", "notes"],
  template: `>
You are KnowNotes, are skilled at taking detailed, concise, and easy-to-understand notes. You are given a portion of a transcript from a lecture that is in progress and the notes that a student has taken on the lecture so far. Your job is to add onto the notes what is missing from the transcript. Distill only the most important points.

Transcript:
{transcript}

Notes:
{notes}

Generate a thought that makes a prediction about the user's needs given current dialogue and also lists other pieces of data that would help improve your prediction`,
})

const OBJECTIVE_SYSTEM_RESPONSE = new PromptTemplate({
  inputVariables: ["thought"],
  template: `>
You are KnowNotes, are skilled at taking detailed, concise, and easy-to-understand notes. You are given a portion of a transcript from a lecture that is in progress and the notes that a student has taken on the lecture so far. Your job is to add onto the notes what is missing from the transcript. Distill only the most important points.

{thought}

You must produce an appropriate response to the user input. Keep your responses concise and specific.`,
})
const OBJECTIVE_HUMAN_THOUGHT = new PromptTemplate({
  inputVariables: ["input"],
  template: `BEGIN DIALOGUE
User: {input}
Thought:`,
})
const OBJECTIVE_HUMAN_RESPONSE = new PromptTemplate({
  inputVariables: ["input"],
  template: `BEGIN DIALOGUE
User: {input}
KnowNotes:`,
})

export function loadChains(
  modelName: string = "gpt-4o-mini",
  temperature: number = 1.2,
  responseLangchainStream: any = {}
) {
  const thoughtLLM = new ChatOpenAI({
    modelName,
    temperature,
    openAIApiKey: env.OPENAI_API_KEY,
  })
  const responseLLM = new ChatOpenAI({
    modelName,
    temperature,
    openAIApiKey: env.OPENAI_API_KEY,
    streaming: true,
    callbacks: CallbackManager.fromHandlers(responseLangchainStream.handlers),
  })

  const objectiveSystemThought = new SystemMessagePromptTemplate(
    OBJECTIVE_SYSTEM_THOUGHT
  )
  const objectiveSystemResponse = new SystemMessagePromptTemplate(
    OBJECTIVE_SYSTEM_RESPONSE
  )

  const objectiveHumanThought = new HumanMessagePromptTemplate(
    OBJECTIVE_HUMAN_THOUGHT
  )
  const objectiveHumanResponse = new HumanMessagePromptTemplate(
    OBJECTIVE_HUMAN_RESPONSE
  )

  const objectiveThoughtChatPrompt = ChatPromptTemplate.fromPromptMessages([
    objectiveSystemThought,
    objectiveHumanThought,
  ])
  const objectiveResponseChatPrompt = ChatPromptTemplate.fromPromptMessages([
    objectiveSystemResponse,
    objectiveHumanResponse,
  ])

  const thoughtChain = new LLMChain({
    llm: thoughtLLM,
    prompt: objectiveThoughtChatPrompt,
    verbose: false,
  })
  const responseChain = new LLMChain({
    llm: responseLLM,
    prompt: objectiveResponseChatPrompt,
    verbose: false,
  })

  return { thoughtChain, responseChain }
}

type ChatParams = {
  input: string
  transcript: string
  notes: string
  thought?: string
  thoughtChain?: LLMChain
  thoughtMemory?: BufferMemory
  responseChain?: LLMChain
  responseMemory?: BufferMemory
}

export async function chat(params: ChatParams): Promise<string> {
  const {
    input,
    transcript,
    notes,
    thought,
    thoughtChain,
    // thoughtMemory,
    responseChain,
    // responseMemory,
  } = params

  if (thought) {
    if (!responseChain)
      throw new Error("Please pass the response chain and memory.")
    // const history: string = (await responseMemory.loadMemoryVariables({}))
    //   .history
    return responseChain.predict({
      input,
      //   history,
      thought,
    })
  } else {
    if (!thoughtChain) throw new Error("Please pass the thought chain.")
    // const history = (await thoughtMemory.loadMemoryVariables({})).history
    return await thoughtChain.predict({
      input,
      //   history,
      transcript,
      notes,
    })
  }
}

export async function chatAndSave(
  chain: {
    thoughtMemory: BufferMemory
    thoughtChain: LLMChain
    responseMemory: BufferMemory
    responseChain: LLMChain
  },
  input: string,
  transcript: string,
  notes: string
) {
  const { thoughtMemory, thoughtChain, responseMemory, responseChain } = chain
  const thought = await chat({
    input,
    thoughtChain,
    thoughtMemory,
    transcript,
    notes,
  })

  const response = chat({
    input,
    thought,
    responseChain,
    responseMemory,
    transcript,
    notes,
  })

  // // Remove this because we fetch the messages from the database on each request
  // thoughtMemory.saveContext({ input: input }, { output: thought })
  // responseMemory.saveContext({ input: input }, { output: response })

  return {
    thought,
    response,
  }
}
