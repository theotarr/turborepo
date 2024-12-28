import React from "react";
import { TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

import { cn } from "~/lib/utils";
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

export const GradientInput = ({
  value,
  onChangeText,
  placeholder,
  height,
  colors = ["#007AFF", "#BD60F4", "#EC447A"],
  locations,
  className,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  height: number;
  colors?: string[];
  locations?: number[];
  className?: string;
}) => {
  return (
    <MaskedView
      style={{
        height: 50,
      }}
      maskElement={
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderClassName="text-muted-foreground/40"
          className={cn(
            "web:flex native:h-12 web:w-full web:py-2 native:text-lg native:leading-[1.25] web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 h-10 rounded-md border border-input bg-background px-3 text-base text-foreground file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground lg:text-sm",
            className,
          )}
        />
      }
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
