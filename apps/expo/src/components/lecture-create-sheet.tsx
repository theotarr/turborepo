import * as React from "react";
import { View } from "react-native";
import { Link } from "expo-router";
import BottomSheet, {
  BottomSheetView,
  useBottomSheet,
} from "@gorhom/bottom-sheet";
import { ChevronRight, Plus } from "lucide-react-native";

import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export function LectureCreateSheet() {
  return (
    <View className="flex-1 items-center justify-center">
      <BottomSheetView>
        <View>
          <Text className="pb-1 text-center text-xl font-bold text-foreground">
            Edit your profile
          </Text>
        </View>
        <View className="gap-5 pt-6">
          <View className="gap-6 pb-2">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <Text className="text-lg">Live Lecture</Text>
                <ChevronRight size={6} />
              </Button>
            </Link>
            <View></View>
          </View>
        </View>
      </BottomSheetView>
    </View>
  );
}
