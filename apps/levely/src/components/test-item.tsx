import type { Href } from "expo-router";
import { View } from "react-native";
import { Link } from "expo-router";
import { SymbolView } from "expo-symbols";

import { Text } from "./ui/text";

export function TestItem({ test, href }: { test: string; href: string }) {
  return (
    <Link href={href as Href<string>}>
      <View className="w-full flex-row items-center justify-between rounded-xl bg-foreground px-4 py-3">
        <Text className="text-lg font-medium text-secondary-foreground">
          {test}
        </Text>
        <SymbolView
          name="arrow.up.right"
          size={16}
          weight="medium"
          tintColor="black"
        />
      </View>
    </Link>
  );
}
