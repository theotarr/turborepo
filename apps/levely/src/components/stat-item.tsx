import { View } from "react-native";

import { cn } from "~/lib/utils";
import { Text } from "./ui/text";

export interface Stat {
  stat: string;
  label: string;
  value: number;
  improvement?: string;
  className?: string;
}

export const StatItem = ({
  stat,
  label,
  value,
  improvement,
  className,
}: Stat) => (
  <View className={cn("mb-5", className)}>
    <Text className="mb-1 text-base font-semibold text-muted-foreground/60">
      {stat}
    </Text>
    <View className="mb-1 flex-row items-center">
      <Text className="text-2xl font-bold text-secondary-foreground">
        {label}
      </Text>
      {improvement ? (
        <Text className="ml-1 text-base font-semibold leading-tight tracking-tighter text-[#34C759]">
          ({improvement})
        </Text>
      ) : null}
    </View>
    <View className="h-2 overflow-hidden rounded bg-background">
      <View
        className={cn(
          "h-full rounded bg-primary",
          improvement && "bg-green-500",
        )}
        style={{ width: `${value}%` }}
      />
    </View>
  </View>
);
