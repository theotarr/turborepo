import { Text, View } from "react-native";
import { Aperture, User } from "lucide-react-native";

import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";
import { cn } from "~/lib/utils";

export const ChatMessage = ({
  id,
  role,
  message,
}: {
  id: number;
  role: string;
  message: string;
}) => {
  const { colorScheme } = useColorScheme();
  return (
    <View key={id} className="my-3 flex-row items-start gap-4 px-4">
      {role === "assistant" ? (
        <View className="flex size-[24] items-center justify-center rounded-md bg-primary shadow-sm">
          <Aperture
            color={NAV_THEME[colorScheme].primaryForeground}
            size={16}
          />
        </View>
      ) : (
        <View className="flex size-[25] items-center justify-center rounded-md border border-border bg-background">
          <User color={NAV_THEME[colorScheme].mutedForeground} size={16} />
        </View>
      )}
      <Text
        className={cn(
          "flex-1 flex-wrap p-1 text-base text-secondary-foreground",
          role === "assistant" && "text-secondary-foreground",
        )}
      >
        {message}
      </Text>
    </View>
  );
};
