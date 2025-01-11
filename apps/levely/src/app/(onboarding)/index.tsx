import { useState } from "react";
import { ImageBackground, SafeAreaView, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import {
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  Rect,
  Stop,
  Svg,
  Use,
} from "react-native-svg";
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";

import { Button } from "~/components/ui/button";
import { GradientText } from "~/components/ui/gradient-text";
import { Text } from "~/components/ui/text";

export default function Index() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  return (
    <ImageBackground
      source={require("../../../assets/background.png")}
      style={{ flex: 1, height: "100%", width: "100%" }}
    >
      <SafeAreaView className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(500)}
          className={`h-full flex-1 flex-col justify-between px-4 pb-24 pt-32 ${step !== 0 ? "hidden" : ""}`}
        >
          <View>
            <View className="flex-row items-center justify-center gap-x-4">
              <Svg width={49} height={46} viewBox="0 0 49 46" fill="none">
                <Mask
                  id="mask0_76_879"
                  style={{
                    maskType: "luminance",
                  }}
                  maskUnits="userSpaceOnUse"
                  x={0}
                  y={0}
                  width={49}
                  height={46}
                >
                  <Path d="M0.141602 0H48.8581V46H0.141602V0Z" fill="white" />
                </Mask>
                <G mask="url(#mask0_76_879)">
                  <Path
                    d="M24.1963 31.8042C22.1482 34.1855 14.9963 44.2416 14.9963 44.2416C13.5177 45.9642 12.33 45.7617 11.4929 45.6094C10.6566 45.47 7.56591 42.9242 7.56591 42.9242C5.91739 41.5184 5.80802 39.581 6.85065 38.5171C8.38981 36.9461 14.8264 29.2964 17.4571 26.8009C13.8691 25.7119 4.28125 23.179 2.32941 22.5705C0.729006 21.8486 0.0261386 20.557 0.365906 19.0248C0.644428 18.2267 1.04471 16.5924 1.29917 16.099C1.86861 14.6802 2.68085 13.464 3.75994 13.1221C4.8383 12.7802 5.61407 13.0467 6.08727 13.3125C6.08727 13.3125 17.0816 17.6312 19.8449 18.7582L20.0629 3.52214C20.3422 1.15299 21.6874 0.000780974 24.0753 0.0639888C25.6873 0.165273 26.6089 0.380789 27.7478 0.533097C28.8758 0.684643 30.7182 1.90082 30.1116 4.49691C30.1116 4.49691 28.4631 15.3641 27.906 18.8344C32.7299 16.7196 43.0454 13.1099 43.0454 13.1099C43.9422 12.8182 45.0089 12.6157 45.991 12.9195C46.9731 13.2234 47.4944 14.1479 47.8335 15.2757L48.6333 17.986C48.9731 19.1131 48.9731 21.0512 47.7 21.646C46.7187 22.1022 33.9905 25.4331 30.9238 26.4209C33.2512 28.9667 39.7483 36.6422 40.9725 38.1112C42.0151 39.6313 41.9546 41.0881 40.7909 42.5068C40.3425 42.9371 38.0757 44.8623 38.0757 44.8623C36.9602 45.7365 35.2635 46.2049 34.245 45.4068C33.2271 44.5584 26.754 35.1481 24.1963 31.8042Z"
                    fill="#231F20"
                  />
                  <Path
                    d="M24.1963 31.8042C22.1482 34.1855 14.9963 44.2416 14.9963 44.2416C13.5177 45.9642 12.33 45.7617 11.4929 45.6094C10.6566 45.47 7.56591 42.9242 7.56591 42.9242C5.91739 41.5184 5.80802 39.581 6.85065 38.5171C8.38981 36.9461 14.8264 29.2964 17.4571 26.8009C13.8691 25.7119 4.28125 23.179 2.32941 22.5705C0.729006 21.8486 0.0261386 20.557 0.365906 19.0248C0.644428 18.2267 1.04471 16.5924 1.29917 16.099C1.86861 14.6802 2.68085 13.464 3.75994 13.1221C4.8383 12.7802 5.61407 13.0467 6.08727 13.3125C6.08727 13.3125 17.0816 17.6312 19.8449 18.7582L20.0629 3.52214C20.3422 1.15299 21.6874 0.000780974 24.0753 0.0639888C25.6873 0.165273 26.6089 0.380789 27.7478 0.533097C28.8758 0.684643 30.7182 1.90082 30.1116 4.49691C30.1116 4.49691 28.4631 15.3641 27.906 18.8344C32.7299 16.7196 43.0454 13.1099 43.0454 13.1099C43.9422 12.8182 45.0089 12.6157 45.991 12.9195C46.9731 13.2234 47.4944 14.1479 47.8335 15.2757L48.6333 17.986C48.9731 19.1131 48.9731 21.0512 47.7 21.646C46.7187 22.1022 33.9905 25.4331 30.9238 26.4209C33.2512 28.9667 39.7483 36.6422 40.9725 38.1112C42.0151 39.6313 41.9546 41.0881 40.7909 42.5068C40.3425 42.9371 38.0757 44.8623 38.0757 44.8623C36.9602 45.7365 35.2635 46.2049 34.245 45.4068C33.2271 44.5584 26.754 35.1481 24.1963 31.8042Z"
                    fill="url(#paint0_linear_76_879)"
                  />
                </G>
                <Defs>
                  <LinearGradient
                    id="paint0_linear_76_879"
                    x1={-22.607}
                    y1={0.0647356}
                    x2={49.5578}
                    y2={0.0647357}
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset={0.210408} stopColor="#BD60F4" />
                    <Stop offset={0.420634} stopColor="#EC447A" />
                    <Stop offset={0.734905} stopColor="#0B8EF8" />
                    <Stop offset={0.985449} stopColor="#0B8EF8" />
                  </LinearGradient>
                </Defs>
              </Svg>
              <Text
                style={{
                  fontSize: 34,
                  lineHeight: 41,
                }}
                className="font-semibold leading-tight tracking-tight text-secondary-foreground"
              >
                Levely
              </Text>
            </View>
            <Text className="mt-12 text-center text-xl leading-[25px] text-secondary-foreground">
              Welcome to Levely
            </Text>
            <View className="mt-12 flex items-center">
              <Image
                style={{
                  width: 295,
                  height: 221,
                  resizeMode: "contain",
                }}
                source={require("../../../assets/app-store.png")}
              />
            </View>
          </View>
          <View className="flex items-center">
            <Button onPress={() => setStep(1)}>
              <Text className="font-regular text-base">
                Get started - it's completely free
              </Text>
            </Button>
          </View>
        </Animated.View>

        <Animated.View
          entering={SlideInRight.duration(500)}
          exiting={SlideOutLeft.duration(500)}
          className={`mx-12 h-full flex-1 flex-col py-12 ${step !== 1 ? "hidden" : ""}`}
        >
          <Text className="text-4xl font-bold leading-tight text-secondary-foreground">
            Discover your personalized
          </Text>
          <GradientText
            className="text-4xl font-bold leading-tight"
            text="study score"
            height={36}
            locations={[0, 1, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.25, y: 0 }}
          />
          <View className="mt-12 flex-1 border-b border-border/20">
            <Image
              style={{
                width: 310,
                height: 497,
                resizeMode: "cover",
                flex: 1,
              }}
              source={require("../../../assets/current.png")}
            />
          </View>
          <View className="mt-6 flex items-center">
            <Button onPress={() => setStep(2)}>
              <Text className="font-regular text-base">Next</Text>
            </Button>
          </View>
        </Animated.View>

        <Animated.View
          entering={SlideInRight.duration(500)}
          exiting={SlideOutLeft.duration(500)}
          className={`mx-12 h-full flex-1 flex-col py-12 ${step !== 2 ? "hidden" : ""}`}
        >
          <Text className="text-4xl font-bold leading-tight text-secondary-foreground">
            See your full
          </Text>
          <GradientText
            className="text-4xl font-bold leading-tight"
            text="learning potential"
            height={36}
            locations={[0, 1, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.25, y: 0 }}
          />
          <View className="mt-12 flex-1 border-b border-border/20">
            <Image
              style={{
                width: 310,
                height: 497,
                resizeMode: "cover",
                flex: 1,
              }}
              source={require("../../../assets/potential.png")}
            />
          </View>
          <View className="mt-6 flex items-center">
            <Button onPress={() => setStep(3)}>
              <Text className="font-regular text-base">Next</Text>
            </Button>
          </View>
        </Animated.View>

        <Animated.View
          entering={SlideInRight.duration(500)}
          exiting={SlideOutLeft.duration(500)}
          className={`mx-12 h-full flex-1 flex-col py-12 ${step !== 3 ? "hidden" : ""}`}
        >
          <Text className="text-4xl font-bold leading-tight text-secondary-foreground">
            Get daily tips to
          </Text>
          <GradientText
            className="text-4xl font-bold leading-tight"
            text="improve fast"
            height={36}
            locations={[0, 1, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.25, y: 0 }}
          />
          <View className="mt-12 flex-1 border-b border-border/20">
            <Image
              style={{
                width: 310,
                height: 497,
                resizeMode: "cover",
                flex: 1,
              }}
              source={require("../../../assets/tips.png")}
            />
          </View>
          <View className="mt-6 flex items-center">
            <Button onPress={() => router.replace("/(onboarding)/onboarding")}>
              <Text className="font-regular text-base">Get Started</Text>
            </Button>
          </View>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}
