import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Svg, {
  Circle,
  Defs,
  FeComposite,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  FeOffset,
  Filter,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { NAV_THEME } from "~/lib/constants";

interface ProgressCircleProps {
  radius: number;
  strokeWidth: number;
  progress: number; // Should be a value between 0 and 1
  label?: string;
}

export const CircularProgress: React.FC<ProgressCircleProps> = ({
  radius,
  strokeWidth,
  progress,
  label,
}) => {
  const [circumference, setCircumference] = useState(0);

  useEffect(() => {
    const adjustedRadius = radius - strokeWidth / 2;
    const circumferenceValue = 2 * Math.PI * adjustedRadius;
    setCircumference(circumferenceValue);
  }, [radius, strokeWidth]);

  const cappedProgress = Math.min(progress, 1); // Cap progress at 1 (100%)
  const strokeDashoffset = circumference * (1 - cappedProgress);

  return (
    <View style={{ aspectRatio: 1, width: radius * 2 }}>
      <Svg width={radius * 2} height={radius * 2}>
        {/* Gradient-filled background */}
        <LinearGradient id="gradient" x1={0} y1={0} x2={1} y2={1}>
          <Stop offset="0" stopColor="#007AFF" stopOpacity={1} />
          <Stop offset="0.5" stopColor="#BD60F4" stopOpacity={1} />
          <Stop offset="1" stopColor="#EC447A" stopOpacity={1} />
        </LinearGradient>
        {/* <Defs>
          <Filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <FeOffset dx="2" dy="2" result="offsetBlur" />
            <FeMerge>
              <FeMergeNode in="offsetBlur" />
              <FeMergeNode in="SourceGraphic" />
            </FeMerge>
          </Filter>
        </Defs> */}
        <Circle
          fill="transparent"
          stroke={NAV_THEME.light.background}
          strokeWidth={strokeWidth}
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
        />
        <Circle
          fill="transparent"
          stroke="url(#gradient)"
          filter="url(#shadow)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          transform={`rotate(-90 ${radius} ${radius})`} // Start from the top
          strokeLinecap="round"
        />

        {label && (
          <SvgText
            x="50%"
            y="50%"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={
              // Smaller font for longer labels
              label.length > 5
                ? radius / 3.25
                : label.length > 3
                  ? radius / 3
                  : radius / 2.5
            }
            fill="#000"
            fontWeight="bold"
          >
            {label}
          </SvgText>
        )}
      </Svg>
    </View>
  );
};
