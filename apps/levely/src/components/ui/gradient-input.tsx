import * as React from "react";
import { TextInput, View } from "react-native";

import { cn } from "~/lib/utils";
import { GradientText } from "./gradient-text";

const GradientInput = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  React.ComponentPropsWithoutRef<typeof TextInput>
>(({ className, placeholderClassName, ...props }, ref) => {
  return (
    <View className="relative">
      <TextInput
        ref={ref}
        className={cn(
          "web:flex native:h-12 web:w-full web:py-2 native:text-lg native:leading-[1.25] h-10 rounded-md bg-background px-3 text-base text-foreground file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground lg:text-sm",
          props.editable === false && "web:cursor-not-allowed opacity-50",
          className,
        )}
        placeholderClassName={cn(
          "text-muted-foreground/40",
          placeholderClassName,
        )}
        {...props}
      />
      {props.value && (
        <GradientText
          text={props.value.toString()}
          height={20}
          className="absolute left-0 top-0"
        />
      )}
    </View>
  );
});

GradientInput.displayName = "GradientInput";

export { GradientInput };
