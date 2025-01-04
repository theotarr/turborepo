import type { LucideIcon } from "lucide-react-native";
import * as React from "react";
import { View } from "react-native";

import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

export function EmptyPlaceholder({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  return (
    <View
      className={cn(
        "min-h-[250px] flex-col items-center justify-center rounded-md border border-dashed border-border p-4",
        className,
      )}
      {...props}
    >
      <View className="flex-col items-center justify-center">{children}</View>
    </View>
  );
}

interface EmptyPlaceholderIconProps {
  icon: LucideIcon;
  className?: string;
  color?: string;
  size?: number;
}

EmptyPlaceholder.Icon = function EmptyPlaceHolderIcon({
  icon: Icon,
  className,
  color,
  size,
}: EmptyPlaceholderIconProps) {
  return (
    <View className="items-center justify-center">
      <Icon
        className={cn("size-10 text-muted-foreground", className)}
        color={color}
        size={size}
      />
    </View>
  );
};

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn(
        "mt-6 text-xl font-semibold text-secondary-foreground",
        className,
      )}
      {...props}
    />
  );
};

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn(
        "mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
};
