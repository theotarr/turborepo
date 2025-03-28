import "server-only";

import { BotMessage, SpinnerMessage, UserMessage } from "@/components/message";
import {
  COURSE_CHAT_SYSTEM_PROMPT,
  COURSE_CHAT_USER_PROMPT,
  LECTURE_CHAT_SYSTEM_PROMPT,
  LECTURE_CHAT_USER_PROMPT,
} from "@/lib/prompt";
import { supabase, vectorStore } from "@/lib/supabase";
import { Transcript } from "@/types";
import { google } from "@ai-sdk/google";
import { CoreMessage } from "ai";
import {
  createAI,
  createStreamableValue,
  getAIState,
  getMutableAIState,
  streamUI,
} from "ai/rsc";
import { v1 as uuidv1 } from "uuid";

import { formatTranscript } from "../utils";

async function submitLectureMessage(
  content: string,
  lectureId: string,
  transcript: Transcript[],
) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();
  // Update the AI state with the new user message.
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: uuidv1(),
        role: "user",
        content,
      },
    ],
  });

  let { data: lecture } = await supabase
    .from("Lecture")
    .select()
    .eq("id", lectureId)
    .single();
  if (!lecture) throw new Error("Lecture not found");

  // Save the user messsage in the DB.
  await supabase.from("Message").insert({
    lectureId,
    content,
    role: "USER",
  });

  let transcriptContext: string = "";

  // If the transcript is longer than 128k tokens, we need to do a similarity search to get the relevant context.
  const estimatedTokens =
    transcript
      .map((t) => t.text)
      .join(" ")
      .split(" ").length * 2;

  if (estimatedTokens > 500_000) {
    const documents = await vectorStore.similaritySearchWithScore(
      content,
      10,
      (rpc) => rpc.eq("metadata->>lectureId", lectureId), // Filter by lecture
    );

    transcriptContext = documents
      .map((t) => `"${t[0].pageContent}"`)
      .join("\n\n");
  } else {
    transcriptContext = formatTranscript(transcript);
  }
  const recentTranscript = transcript.slice(-20);
  const messagesLength = aiState.get().messages.length;

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;

  const result = await streamUI({
    // @ts-ignore
    model: google("gemini-2.0-flash-001"),
    initial: <SpinnerMessage />,
    messages: [
      { role: "system", content: await LECTURE_CHAT_SYSTEM_PROMPT.format({}) },
      ...aiState
        .get()
        .messages.map((message: any) => ({
          role: message.role,
          content: message.content,
          name: message.name,
        }))
        .slice(0, messagesLength - 1), // Skip the last message, which is the user message. We need to add in the context instead.
      {
        role: "user",
        content: await LECTURE_CHAT_USER_PROMPT.format({
          // If the transcript is longer than 128k tokens, we need to show the context plus the recent dialogue.
          transcript:
            estimatedTokens < 128000
              ? transcriptContext
              : transcriptContext + "\n\n" + formatTranscript(recentTranscript),
          message: content,
        }),
      },
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: async ({ content, delta, done }) => {
      if (!textStream) {
        textStream = createStreamableValue("");
        textNode = <BotMessage content={textStream.value} />;
      }

      // When it's the final content, mark the state as done and ready for the client to access.
      if (done) {
        // Save the AI response in the DB.
        await supabase.from("Message").insert({
          content,
          role: "ASSISTANT",
          lectureId,
        });

        textStream.done();
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: uuidv1(),
              role: "assistant",
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
  });

  return {
    id: uuidv1(),
    role: "assistant",
    display: result.value,
  };
}

async function submitCourseMessage(
  content: string,
  userId: string,
  chatId: string,
  courseId: string,
) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();
  // Update the AI state with the new user message.
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: uuidv1(),
        role: "user",
        content,
      },
    ],
  });

  let { data: chat } = await supabase
    .from("Chat")
    .select()
    .eq("id", chatId)
    .single();
  if (!chat) {
    const { data } = await supabase
      .from("Chat")
      .insert({
        id: chatId,
        name: `${content.slice(0, 20)}...`,
        courseId,
        userId,
      })
      .select()
      .single();
    chat = data;
  }
  if (!chat) return new Response("Stored chat not found", { status: 404 });

  // Save the user messsage in the DB.
  await supabase.from("Message").insert({
    content,
    role: "USER",
    chatId,
  });

  // Fetch the relevant lecture transcripts from the db.
  const similarCourseDocumentsWithScore =
    await vectorStore.similaritySearchWithScore(
      content,
      10,
      (rpc) => rpc.eq("metadata->>courseId", courseId), // Filter by course.
    );
  // Filter out the documents with a score less than 0.8.
  const similarCourseDocuments = similarCourseDocumentsWithScore
    .filter((doc) => doc[1] > 0.8)
    .map((doc) => doc[0]);
  const context = similarCourseDocuments
    .map((doc, i) => `${i}. ${doc.pageContent}`)
    .join("\n\n");
  const uniqueLectures = [
    ...new Set(similarCourseDocuments.map((doc) => doc.metadata.lectureId)),
  ];
  const { data: lectures, error } = await supabase
    .from("Lecture")
    .select("*")
    .in("id", uniqueLectures);
  if (error) throw error;
  const sourceList = lectures.map((l) => ({
    id: l.id,
    title: l.title,
    source: l.youtubeVideoId ? "YouTube" : "Lecture",
    date: l.createdAt,
  }));

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode = (
    <BotMessage sources={sourceList} content={""} />
  );

  const messagesLength = aiState.get().messages.length;

  const result = await streamUI({
    // @ts-expect-error - Google model has different type signature than OpenAI
    model: google("gemini-2.0-flash-001"),
    initial: <BotMessage sources={sourceList} content={""} />,
    messages: [
      { role: "system", content: await COURSE_CHAT_SYSTEM_PROMPT.format({}) },
      ...aiState
        .get()
        .messages.map((message: any) => ({
          role: message.role,
          content: message.content,
          name: message.name,
        }))
        .slice(0, messagesLength - 1), // Skip the last message, which is the user message. We need to add in the context instead.
      {
        role: "user",
        content: await COURSE_CHAT_USER_PROMPT.format({
          context,
          message: content,
          sources: sourceList,
        }),
      },
    ],
    // `text` is called when an AI returns a text response (as opposed to a tool call).
    // Its content is streamed from the LLM, so this function will be called
    // multiple times with `content` being incremental.
    text: async ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue("");
        textNode = (
          <BotMessage sources={sourceList} content={textStream.value} />
        );
      }

      // When it's the final content, mark the state as done and ready for the client to access.
      if (done) {
        // Save the AI response in the DB.
        await supabase.from("Message").insert({
          sources: sourceList,
          content,
          role: "ASSISTANT",
          chatId,
        });

        textStream.done();
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: uuidv1(),
              role: "assistant",
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
  });

  return {
    id: uuidv1(),
    role: "assistant",
    display: result.value,
  };
}

// The initial UI state that the client will keep track of, which contains the message IDs and their UI nodes.
export type UIState = {
  id: string;
  role: "function" | "user" | "assistant" | "system" | "data" | "tool";
  display: React.ReactNode;
}[];

export type Message = CoreMessage & {
  id: string;
  name?: string;
  sources?: { id: string; title: string; source: string; date: string }[];
  role: "user" | "assistant" | "system" | "function" | "data" | "tool";
};

// Define the initial state of the AI. It can be any JSON object.
export type AIState = {
  chatId: string;
  messages: Message[];
};
// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<AIState, UIState>({
  actions: {
    submitCourseMessage,
    submitLectureMessage,
  },
  // Each state can be any shape of object, but for chat applications
  // it makes sense to have an array of messages. Or you may prefer something like { id: number, messages: Message[] }
  initialUIState: [],
  initialAIState: {
    chatId: uuidv1(),
    messages: [
      {
        id: uuidv1(),
        role: "assistant",
        content:
          "Hey there! I&apos;m an AI assistant trained on all your lectures and course materials. Ask me anything!",
      },
    ],
  },
  onGetUIState: async () => {
    "use server";

    const aiState = getAIState();

    if (aiState) {
      // @ts-ignore
      const uiState = getUIStateFromAIState(aiState);
      return uiState;
    }
  },
});

export const getUIStateFromAIState = (aiState: AIState) => {
  return aiState.messages
    .filter((message) => message.role !== "system")
    .map((message, index) => ({
      id: index.toString(),
      role: message.role,
      display:
        message.role === "user" ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === "assistant" ? (
          <BotMessage
            sources={message.sources}
            content={message.content as string}
          />
        ) : (
          <></>
        ),
    }));
};
