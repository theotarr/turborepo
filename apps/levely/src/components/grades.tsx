import React, { FC, useState } from "react";
import { Text, TextInput, View } from "react-native";
import Slider, { MarkerProps } from "@react-native-community/slider";

import { NAV_THEME } from "~/lib/constants";

const grades = ["F", "D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
export interface Subject {
  id: number;
  name: string;
  grade: string;
}

export const GradeInput = ({
  subject,
  initialGrade = "A",
  onSubjectChange,
}: {
  subject: Subject;
  initialGrade?: string;
  onSubjectChange?: (subject: Subject) => void;
}) => {
  const [grade, setGrade] = useState(grades.indexOf(initialGrade));

  function handleChange(newGrade: number) {
    setGrade(newGrade);
    onSubjectChange?.({ ...subject, grade: grades[newGrade] ?? "F" });
  }

  const StepMarker: FC<MarkerProps> = ({ stepMarked }) => {
    function calcMargin() {
      // If left of center, add margin to the left
      const midpoint = grades.length / 2;
      const multiplier = 0.5; // Adjust this value to control the steepness of the parabola

      if (grade < midpoint) {
        return {
          marginLeft: Math.pow(midpoint - grade, 2) * multiplier,
          marginRight: 0,
        };
      } else if (grade > midpoint) {
        return {
          marginLeft: 0,
          marginRight: Math.pow(grade - midpoint, 2) * multiplier,
        };
      }
    }

    return stepMarked ? (
      <Text
        style={calcMargin()}
        className="text-sm font-semibold text-secondary-foreground"
        // entering={FadeIn.duration(50)}
        // exiting={FadeOut.duration(50)}
      >
        {grades[grade]}
      </Text>
    ) : null;
  };

  return (
    <View className="mb-4 px-4">
      <View
        style={{
          borderBottomColor: "hsla(0, 0%, 33%, 0.34)",
          borderBottomWidth: 0.5,
        }}
        className="my-2 flex-row items-center gap-x-6"
      >
        <Text className="text-base font-light">Subject</Text>
        <TextInput
          className="pb-3.5 pt-2 text-lg"
          placeholder="Enter subject"
          value={subject.name}
          onChangeText={(text) => onSubjectChange?.({ ...subject, name: text })}
          placeholderTextColor="hsl(0, 0%, 60%)"
        />
      </View>
      <View
        style={{
          borderBottomColor: "hsla(0, 0%, 33%, 0.34)",
          borderBottomWidth: 0.5,
        }}
        className="my-2 flex-row items-center gap-x-10"
      >
        <Text className="text-base font-light">Grade</Text>
        <View className="flex-row items-center justify-start">
          <Text className="text-base font-medium text-muted-foreground/80">
            F
          </Text>
          <Slider
            style={{ width: "70%", marginHorizontal: 10 }}
            minimumValue={0}
            maximumValue={grades.length - 1}
            step={1}
            value={grade}
            onValueChange={handleChange}
            minimumTrackTintColor={NAV_THEME.light.primary}
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor={NAV_THEME.light.secondary}
            StepMarker={StepMarker}
            tapToSeek
          />
          <Text className="text-base font-medium text-muted-foreground/80">
            A+
          </Text>
        </View>
      </View>
    </View>
  );
};
