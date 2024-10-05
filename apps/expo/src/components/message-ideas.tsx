import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const exampleMessages = [
  {
    heading: "Help me study for the test",
    subheading: `on the history of Reconstruction in the US`,
    message: `Help me study for the test on the history of Reconstruction in the US`,
  },
  {
    heading: "What did my teacher say",
    subheading: "that I need to know for the test?",
    message: `What did my teacher say that I need to know for the test?`,
  },
  {
    heading: "Search for relevant quotes",
    subheading: "about Macbeth's soliloquy",
    message: "Search for relevant quotes about a Macbeth's soliloquy",
  },
];

interface Props {
  onSelectCard: (message: string) => void;
}

export const MessageIdeas = ({ onSelectCard }: Props) => {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          gap: 16,
        }}
      >
        {exampleMessages.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="rounded-lg bg-secondary p-4"
            onPress={() => onSelectCard(item.message)}
          >
            <Text className="font-medium text-secondary-foreground">
              {item.heading}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {item.subheading}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
