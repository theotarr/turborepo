import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

import { Text } from "./text";

export const GradientText = ({
  text,
  height,
  colors = ["#007AFF", "#BD60F4", "#EC447A"],
  locations,
  className,
}: {
  text: string;
  height: number;
  colors?: string[];
  locations?: number[];
  className?: string;
}) => {
  return (
    <MaskedView
      style={{
        height,
      }}
      maskElement={<Text className={className}>{text}</Text>}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={{ flex: 1 }}
        {...(locations ? { locations } : {})}
      />
    </MaskedView>
  );
};
