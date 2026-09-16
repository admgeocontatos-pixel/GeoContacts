import type { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs/types";
import * as Haptics from "expo-haptics";
import { Pressable } from "react-native";
import type { ComponentType } from "react";
import type { GestureResponderEvent } from "react-native";

const CompatiblePressable = Pressable as unknown as ComponentType<BottomTabBarButtonProps>;

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <CompatiblePressable
      {...props}
      onPressIn={(ev: GestureResponderEvent) => {
        if (process.env.EXPO_OS === "ios") {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
