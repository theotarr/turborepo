import type { SlottableTextProps, TextRef } from "@rn-primitives/types";
import * as React from "react";
import { Text as RNText } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Slot from "@rn-primitives/slot";

import { cn } from "~/lib/utils";

const TextClassContext = React.createContext<string | undefined>(undefined);

const Text = React.forwardRef<TextRef, SlottableTextProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext);
    const Component = asChild ? Slot.Text : RNText;
    return (
      <Component
        className={cn(
          "web:select-text text-base text-foreground",
          textClass,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Text.displayName = "Text";

export { Text, TextClassContext };

interface GradientTextProps extends SlottableTextProps {
  text: string;
  [props: string]: any;
}

export const GradientText = (props: GradientTextProps) => {
  return (
    <MaskedView
      maskElement={
        <RNText style={[props.style, { backgroundColor: "transparent" }]}>
          {props.text}
        </RNText>
      }
    >
      <LinearGradient
        colors={["red", "green"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <RNText style={[props.style, { opacity: 0 }]}>{props.text}</RNText>
      </LinearGradient>
    </MaskedView>
  );
};
