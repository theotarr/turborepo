import { useState } from "react";
import { Pressable, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { SymbolView } from "expo-symbols";

import { CircularProgress } from "./circular-progress";
import { Text } from "./ui/text";

export function MemorySection({
  onProgress,
  onSectionComplete,
}: {
  onProgress: (progress: number) => void;
  onSectionComplete: () => void;
}) {
  const [startTime, setStartTime] = useState(Date.now());
  const [page, setPage] = useState(0);
  const [userInput, setUserInput] = useState("");

  const handleContentRead = () => {
    setPage(1);
    const endTime = Date.now();
    const timeTakenMs = endTime - startTime;
    console.log(`Time taken: ${timeTakenMs} ms`);
  };

  return (
    <View className="flex h-full justify-around p-4">
      {page === 2 ? (
        <View className="flex items-center justify-center">
          <Text className="mb-8 text-3xl font-semibold text-secondary-foreground">
            Amazing job!
          </Text>
          <CircularProgress
            radius={75}
            strokeWidth={18}
            progress={1}
            label="100%"
          />
        </View>
      ) : page === 1 ? (
        <View>
          <Text className="mb-6 text-2xl font-bold text-secondary-foreground">
            Write down everything you remember...
          </Text>
          <TextInput
            placeholder="Type here..."
            className="p-4 text-xl text-secondary-foreground"
            numberOfLines={6}
            multiline={true}
            onChangeText={setUserInput}
          />
        </View>
      ) : (
        <View>
          <Text className="mb-6 text-2xl font-bold text-secondary-foreground">
            Lets test your memory. Read this text only once
          </Text>
          <Text className="text-lg text-muted-foreground/70">
            Korem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu
            turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus
            nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum
            tellus elit sed risus. Maecenas eget condimentum velit, sit amet
            feugiat lectus. Class aptent taciti sociosqu ad litora torquent per
            conubia nostra, per inceptos himenaeos. Praesent auctor purus luctus
            enim egestas, ac scelerisque ante pulvinar. Donec ut rhoncus ex.
            Suspendisse ac rhoncus nisl, eu tempor urna. Curabitur vel bibendum
            lorem. Morbi convallis convallis diam sit amet lacinia. Aliquam in
            elementum tellus.
          </Text>
        </View>
      )}
      <Pressable
        className="absolute bottom-24 right-4 flex size-16 items-center justify-center rounded-full bg-primary"
        onPress={() => {
          if (page === 0) {
            handleContentRead();
            onProgress((2 / 3) * 100);
          } else if (page === 1) {
            setPage(2);
            onProgress(100);
          } else {
            onSectionComplete();
            onProgress(100);
          }
        }}
      >
        <SymbolView
          name="arrow.right"
          resizeMode="scaleAspectFit"
          size={24}
          weight="light"
          tintColor="white"
        />
      </Pressable>
    </View>
  );
}
