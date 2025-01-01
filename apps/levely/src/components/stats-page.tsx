import { Dimensions, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";

import type { Stat } from "~/components/stat-item";
import { CircularProgress } from "~/components/circular-progress";
import { LevelyIcon } from "~/components/icon";
import { StatItem } from "~/components/stat-item";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const StatsPage = ({
  heading,
  overall,
  overallLabel,
  stats,
}: {
  heading: string;
  overall: number;
  overallLabel: string;
  stats: Stat[];
}) => (
  <View style={{ width: SCREEN_WIDTH - 32 }}>
    <View className="py-5">
      <View className="mb-6 flex-row items-center">
        <View className="flex-row items-center gap-2">
          <LevelyIcon size={24} />
          <Text className="text-2xl font-light text-secondary-foreground/80">
            Levely
          </Text>
        </View>
      </View>
      <View className="mb-8 flex items-center">
        <Text className="mb-8 text-3xl font-medium text-secondary-foreground">
          {heading}
        </Text>
        <CircularProgress
          radius={75}
          strokeWidth={18}
          progress={overall}
          label={overallLabel}
        />
      </View>
      <View className="mb-8 flex items-center justify-center">
        <FlatList
          data={stats}
          scrollEnabled={false}
          numColumns={2}
          keyExtractor={(_, index) => index.toString()}
          contentContainerClassName="w-full"
          renderItem={({ item, index }) => (
            <View className={cn("w-[45%]", index % 2 === 0 ? "mr-2" : "ml-2")}>
              <StatItem
                stat={item.stat}
                label={item.label}
                value={item.value}
                improvement={item.improvement}
              />
            </View>
          )}
        />
      </View>
    </View>
  </View>
);

export const DashboardStatsPage = ({
  heading,
  overall,
  overallLabel,
  stats,
  className,
}: {
  heading: string;
  overall: number;
  overallLabel: string;
  stats: Stat[];
  className?: string;
}) => (
  <View style={{ width: SCREEN_WIDTH - 64 }} className={cn("py-4", className)}>
    <View className="mb-4 rounded-xl bg-foreground px-4 py-3 pb-6">
      <Text className="mb-4 text-xl font-medium text-secondary-foreground">
        {heading}
      </Text>
      <View className="flex items-center">
        <CircularProgress
          radius={80}
          strokeWidth={20}
          progress={overall}
          label={overallLabel}
        />
      </View>
    </View>
    <View className="flex items-center justify-center">
      <FlatList
        data={stats}
        scrollEnabled={false}
        numColumns={2}
        keyExtractor={(_, index) => index.toString()}
        contentContainerClassName="w-full"
        renderItem={({ item, index }) => (
          <View
            className={cn(
              "my-2 w-[48%] rounded-xl bg-foreground p-3",
              index % 2 === 0 ? "mr-2" : "ml-2",
            )}
          >
            <StatItem
              stat={item.stat}
              label={item.label}
              value={item.value}
              improvement={item.improvement}
              className="mb-0"
            />
          </View>
        )}
      />
    </View>
  </View>
);
