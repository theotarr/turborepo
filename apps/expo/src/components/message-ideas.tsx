import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const exampleMessages = [
  {
    heading: "List the key concepts",
    subheading: `from the lecture.`,
    message: `List the key concepts from the lecture.`,
  },
  {
    heading: "Summarize the lecture",
    subheading: "and action items.",
    message: `Summarize the lecture and action items.`,
  },
  {
    heading: "What do I need to know",
    subheading: "for the exam?",
    message: "What do I need to know for the exam?",
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
