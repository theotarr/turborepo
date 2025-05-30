import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  View,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { Aperture, ChevronLeft } from "lucide-react-native";

import { ChatForm } from "~/components/chat-form";
import { ChatMessage } from "~/components/chat-message";
import { MessageIdeas } from "~/components/message-ideas";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";

export default function Lecture() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");
  const { data: lecture } = api.lecture.byId.useQuery({ id });

  const createMessage = api.lecture.chat.useMutation();
  const [messages, setMessages] = useState<
    {
      id: number;
      role: "assistant" | "user";
      message: string;
    }[]
  >([]);
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [height, setHeight] = useState(0);

  // Get the height of the screen.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLayout = (event: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { height } = event.nativeEvent.layout;
    setHeight(height / 2);
  };

  const submitMessage = async (value: string) => {
    if (!lecture) return;

    const { message } = await createMessage.mutateAsync({
      lectureId: lecture.id,
      messages,
    });
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        role: "user",
        message: value,
      },
      {
        id: messages.length,
        role: "assistant",
        message,
      },
    ]);
  };

  if (!lecture)
    return (
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <ChevronLeft
                className="m-0 p-0"
                color={NAV_THEME[colorScheme].secondaryForeground}
                size={20}
              />
            </Pressable>
          ),
          headerTitle: "Chat",
        }}
      />
    );

  return (
    <SafeAreaView className="w-full flex-1 bg-background">
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <ChevronLeft
                className="m-0 p-0"
                color={NAV_THEME[colorScheme].secondaryForeground}
                size={20}
              />
            </Pressable>
          ),
          headerTitle: "Chat",
        }}
      />
      <View className="flex-1" onLayout={onLayout}>
        {messages.length == 0 && (
          <View
            className="flex size-12 items-center justify-center"
            style={[{ marginTop: height / 2 - 100, alignSelf: "center" }]}
          >
            <Aperture
              color={NAV_THEME[colorScheme].mutedForeground}
              size={36}
            />
          </View>
        )}
        <FlatList
          data={messages}
          renderItem={({ item }) => <ChatMessage {...item} />}
          contentContainerStyle={{ paddingTop: 30, paddingBottom: 150 }}
          keyboardDismissMode="on-drag"
        />
        {isLoadingMessage && (
          <View className="ml-4 h-8">
            <ActivityIndicator
              color={NAV_THEME[colorScheme].mutedForeground}
              size="small"
            />
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={70}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
        }}
      >
        {messages.length === 0 && (
          <MessageIdeas
            onSelectCard={async (value) => {
              setIsLoadingMessage(true);
              setMessages([
                ...messages,
                {
                  id: messages.length,
                  role: "user",
                  message: value,
                },
              ]);
              await submitMessage(value);
              setIsLoadingMessage(false);
            }}
          />
        )}
        <ChatForm
          onSubmit={async (value) => {
            setIsLoadingMessage(true);
            setMessages([
              ...messages,
              {
                id: messages.length,
                role: "user",
                message: value,
              },
            ]);
            await submitMessage(value);
            setIsLoadingMessage(false);
          }}
          isLoading={isLoadingMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
