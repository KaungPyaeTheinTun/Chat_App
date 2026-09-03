import React, { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function AppSwitch({ value, disabled = false, onValueChange }) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progress, value]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["#d7dce5", colors.primarySoft],
  });

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 20],
  });

  const thumbColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.white, colors.primary],
  });

  const handlePress = () => {
    if (disabled) {
      return;
    }

    onValueChange?.(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          paddingVertical: 2,
          backgroundColor: trackColor,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: thumbColor,
            shadowColor: "#000000",
            shadowOpacity: 0.14,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
            transform: [{ translateX: thumbTranslateX }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
