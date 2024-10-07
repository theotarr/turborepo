import React, { useEffect } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  // FeGaussianBlur,
  // Filter,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

const { width, height } = Dimensions.get("window");
const AnimatedPath = Animated.createAnimatedComponent(Path);

export const GlowingWaves = () => {
  const progress = useSharedValue(0);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    colorProgress.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const createWave = (
    offset: number,
    amplitude: number,
    strokeWidth: number,
  ) => {
    return useAnimatedProps(() => {
      const phase = (progress.value + offset) * Math.PI * 2;
      let d = `M 0 ${height / 2}`;

      for (let x = 0; x <= width; x += 5) {
        const y = Math.sin(x / 50 + phase) * amplitude + height / 2;
        d += ` L ${x} ${y}`;
      }

      const color = interpolateColor(
        colorProgress.value,
        [0, 0.5, 1],
        ["#FF1493", "#00BFFF", "#FF1493"],
      );

      return { d, stroke: color, strokeWidth };
    });
  };

  const wave1 = createWave(0, 40, 3.5);
  const wave2 = createWave(0.05, 44, 3);
  const wave3 = createWave(0.1, 48, 2.5);
  const wave4 = createWave(0.15, 44, 3);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Svg height={height} width={width}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
          {/* <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%"> */}
          {/* <FeGaussianBlur stdDeviation="10" /> */}
          {/* </Filter> */}
        </Defs>
        <AnimatedPath animatedProps={wave4} fill="none" filter="url(#glow)" />
        <AnimatedPath animatedProps={wave3} fill="none" filter="url(#glow)" />
        <AnimatedPath animatedProps={wave2} fill="none" filter="url(#glow)" />
        <AnimatedPath animatedProps={wave1} fill="none" filter="url(#glow)" />
      </Svg>
    </View>
  );
};
