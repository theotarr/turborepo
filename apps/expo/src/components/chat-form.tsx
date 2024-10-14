import { useState } from "react";
import { Pressable, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { CornerDownLeft } from "lucide-react-native";

import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";

export interface PromptProps {
  onSubmit: (value: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatForm({
  onSubmit,
  isLoading,
  placeholder = "Ask anything...",
}: PromptProps) {
  const { colorScheme } = useColorScheme();
  const [input, setInput] = useState("");
  const { bottom } = useSafeAreaInsets();

  return (
    <BlurView
      intensity={90}
      style={{ paddingBottom: bottom + 4, paddingTop: 10 }}
    >
      <View className="flex flex-row items-center justify-center px-5">
        <TextInput
          autoFocus
          placeholder={placeholder}
          className="mx-5 flex-1 rounded-full border border-border bg-background p-3 px-4 text-secondary-foreground"
          onChangeText={setInput}
          value={input}
          multiline
        />
        <Pressable
          onPress={async () => {
            if (!input.trim()) return;
            await onSubmit(input);
            setInput("");
          }}
          disabled={isLoading || input === ""}
          className="rounded-full bg-accent p-2.5"
        >
          {input.length > 0 ? (
            <CornerDownLeft
              color={NAV_THEME[colorScheme].secondaryForeground}
              size={20}
            />
          ) : (
            <CornerDownLeft
              color={NAV_THEME[colorScheme].mutedForeground}
              size={20}
            />
          )}
        </Pressable>
      </View>
    </BlurView>
  );
}
