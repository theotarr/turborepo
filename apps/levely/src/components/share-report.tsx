import { Share, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { SymbolView } from "expo-symbols";

import { cn } from "~/lib/utils";
import { Text } from "./ui/text";

export function ShareReport({ className }: { className?: string }) {
  async function handleShare() {
    const result = await Share.share({
      message: `Check out my Levely report!`,
      url: `https://levely.app`, // TODO: Add share url or App Store link
    });
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
      } else {
        // shared
      }
    }
  }

  return (
    <TouchableOpacity onPress={handleShare}>
      <View className={cn("flex-row items-center justify-center", className)}>
        <SymbolView
          name="square.and.arrow.up"
          resizeMode="scaleAspectFit"
          scale="small"
          weight="medium"
          tintColor="black"
        />
        <Text className="ml-2 text-lg font-medium text-secondary-foreground">
          Share my report
        </Text>
      </View>
    </TouchableOpacity>
  );
}
