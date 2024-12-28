import { View } from "react-native";

import { cn } from "~/lib/utils";
import { QuestionItem } from "./question-item";
import { Text } from "./ui/text";

export interface QuestionProps {
  question: string;
  options: string[];
  selectedOption?: string;
  onSelect?: (option: string) => void;
  className?: string;
}

export const Question = ({
  question,
  options,
  selectedOption,
  onSelect,
  className,
}: QuestionProps) => {
  return (
    <View className={cn("p-4", className)}>
      <Text className="mb-6 text-2xl font-bold text-secondary-foreground">
        {question}
      </Text>
      {options.map((option, index) => (
        <QuestionItem
          key={index}
          text={option}
          isSelected={selectedOption === option}
          onSelect={() => onSelect?.(option)}
        />
      ))}
    </View>
  );
};
