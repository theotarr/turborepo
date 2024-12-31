import { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Stack } from "expo-router";

import type { Stat } from "~/components/stat-item";
import { DashboardStatsPage } from "~/components/stats-page";
import { getStats } from "~/lib/storage";
import { calculateOverall, formatStatsObject } from "~/lib/utils";

export default function Dashboard() {
  const [overall, setOverall] = useState(0);
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    void (async () => {
      const stats = await getStats();
      if (stats) {
        setStats(formatStatsObject(stats));
        setOverall(calculateOverall(stats));
      }
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ header: () => <></> }} />
      <View className="mx-4 mt-8 flex-1">
        <ScrollView className="flex-1 px-5">
          <DashboardStatsPage
            heading="Overall Stats"
            overall={overall / 100}
            overallLabel={`${overall.toFixed(0)}%`}
            stats={stats}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
