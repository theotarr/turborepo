import React from "react";
import { Text, View } from "react-native";

import { cn } from "~/lib/utils";
import { Progress } from "./ui/gradient-progress";

export interface PaginationProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  progress: number;
  className?: string;
}

export const Pagination = ({
  currentStep,
  totalSteps,
  steps,
  progress,
  className,
}: PaginationProps) => {
  return (
    <View className={cn("px-4 py-3", className)}>
      <View className="flex-row items-center justify-between">
        {/* Completed and current steps */}
        <View className="flex-1 flex-row items-center">
          {steps.slice(0, currentStep).map((_, index) => (
            <View
              key={index + 1}
              className="mx-2 flex size-6 items-center justify-center rounded-full bg-foreground"
            >
              <Text className="text-sm font-medium text-secondary-foreground">
                {index + 1}
              </Text>
            </View>
          ))}
          {/* Current step */}
          <Text className="text-base font-semibold">
            {steps[currentStep - 1]}
          </Text>
          <View className="mx-4 flex-1">
            <Progress className="h-1" value={progress} />
          </View>
        </View>
        {/* Remaining steps */}
        <View className="flex-row items-center">
          {Array.from({ length: totalSteps - currentStep }, (_, index) => (
            <View
              key={index + currentStep + 1}
              className="mr-1 flex size-6 items-center justify-center rounded-full bg-foreground"
            >
              <Text className="text-sm font-medium text-secondary-foreground">
                {currentStep + index + 1}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
