import { Text, View } from "react-native";
import { Aperture, User } from "lucide-react-native";

import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/theme";

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
        <View className="rounded-lg bg-muted p-1">
          <Aperture
            color={NAV_THEME[colorScheme].secondaryForeground}
            size={20}
          />
        </View>
      ) : (
        <View className="rounded-lg bg-muted p-1">
          <User color={NAV_THEME[colorScheme].secondaryForeground} size={20} />
        </View>
      )}
      <Text className="flex-1 flex-wrap p-1 text-base">{message}</Text>
    </View>
  );
};
