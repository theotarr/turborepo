import { useState } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Redirect, Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Aperture } from "lucide-react-native";

import type { RouterOutputs } from "~/utils/api";
import { TrustPilot } from "~/components/trust-pilot";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { api } from "~/utils/api";
import { useSignIn, useSignOut, useUser } from "~/utils/auth";

function LectureCard(props: {
  lecture: RouterOutputs["lecture"]["all"][number];
  onDelete?: () => void;
}) {
  return (
    <View className="flex flex-row rounded-lg bg-muted p-4">
      <View className="flex-grow">
        <Link
          asChild
          href={{
            pathname: "/lecture/[id]",
            params: { id: props.lecture.id },
          }}
        >
          <Pressable className="">
            <Text className="text-xl font-semibold text-primary">
              {props.lecture.title}
            </Text>
            <Text className="mt-2 text-foreground">
              {props.lecture.transcript.toString()}
            </Text>
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={props.onDelete}>
        <Text className="font-bold uppercase text-primary">Delete</Text>
      </Pressable>
    </View>
  );
}

// function CreatePost() {
//   const utils = api.useUtils();

//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");

//   const { mutate, error } = api.post.create.useMutation({
//     async onSuccess() {
//       setTitle("");
//       setContent("");
//       await utils.post.all.invalidate();
//     },
//   });

//   return (
//     <View className="mt-4 flex gap-2">
//       <TextInput
//         className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
//         value={title}
//         onChangeText={setTitle}
//         placeholder="Title"
//       />
//       {error?.data?.zodError?.fieldErrors.title && (
//         <Text className="mb-2 text-destructive">
//           {error.data.zodError.fieldErrors.title}
//         </Text>
//       )}
//       <TextInput
//         className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
//         value={content}
//         onChangeText={setContent}
//         placeholder="Content"
//       />
//       {error?.data?.zodError?.fieldErrors.content && (
//         <Text className="mb-2 text-destructive">
//           {error.data.zodError.fieldErrors.content}
//         </Text>
//       )}
//       <Pressable
//         className="flex items-center rounded bg-primary p-2"
//         onPress={() => {
//           mutate({
//             title,
//             content,
//           });
//         }}
//       >
//         <Text className="text-foreground">Create</Text>
//       </Pressable>
//       {error?.data?.code === "UNAUTHORIZED" && (
//         <Text className="mt-2 text-destructive">
//           You need to be logged in to create a post
//         </Text>
//       )}
//     </View>
//   );
// }

export default function Page() {
  const user = useUser();
  const signIn = useSignIn();
  const { colorScheme } = useColorScheme();

  if (user) {
    return <Redirect href={"/(dashboard)/dashboard"} />;
  }

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "" }} />
      <View className="h-full w-full p-4">
        <View className="flex h-full flex-col items-center justify-between gap-4">
          <View className="flex flex-col items-center gap-6">
            <TrustPilot />
            <Text className="text-center text-4xl font-bold leading-tight tracking-tighter text-secondary-foreground">
              The AI Assitant{"\n"} For Students
            </Text>
            <Text className="max-w-sm text-center text-lg text-muted-foreground">
              KnowNotes transcribes lectures and creates detailed notes,
              flashcards, and quizzes so you can ace your classes easily.
            </Text>
          </View>
          <View className="mb-8 w-full">
            <Button
              variant="outline"
              className="flex w-full flex-row gap-2 rounded-full"
              size="lg"
              onPress={() => signIn()}
            >
              <Aperture
                size={24}
                color={NAV_THEME[colorScheme].secondaryForeground}
              />
              <Text>Continue on KnowNotes.ai</Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
