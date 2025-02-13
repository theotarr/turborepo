import { View } from "react-native";

import { Text } from "./ui/text";

export function ReviewCard({
  name,
  university,
  rating,
  review,
}: {
  name: string;
  university: string;
  rating: number;
  review: string;
}) {
  return (
    <View className="w-full items-center">
      <View className="w-full rounded-xl bg-secondary p-5">
        <Text className="text-xl">
          {new Array(rating).fill("⭐️").join("")}
        </Text>
        <Text className="mt-4 text-lg font-semibold">{review}</Text>
        <Text className="mt-4 text-sm font-medium">{name}</Text>
        <Text className="mt-0.5 text-sm text-muted-foreground">
          {university}
        </Text>
      </View>
    </View>
  );
}
