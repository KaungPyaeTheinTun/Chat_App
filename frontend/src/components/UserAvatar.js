import React, { useEffect, useRef } from "react";
import { Animated, Image, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { resolveMediaUrl } from "../utils/media";

export default function UserAvatar({ user, size = 46, showOnline = true }) {
  const { colors } = useTheme();
  const avatarUri = resolveMediaUrl(user?.avatarUrl);
  const isOnline = showOnline && user?.status === "online";
  const hasPresenceStatus =
    showOnline && (user?.status === "online" || user?.status === "offline");
  const dotSize = Math.max(10, Math.round(size * 0.26));
  const visibleDotSize = isOnline
    ? dotSize
    : Math.max(8, Math.round(size * 0.2));
  const borderWidth = Math.max(2, Math.round(size * 0.05));
  const dotColor = isOnline ? colors.success || "#41c95c" : "#000000";
  const dotBorderColor = isOnline ? colors.background : "#c0c0c0";
  const dotBorderWidth = isOnline ? borderWidth : 1;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isOnline) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isOnline, pulse]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.1],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      {avatarUri ? (
        <Image
          source={{ uri: avatarUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontWeight: "800",
              fontSize: size / 2.5,
            }}
          >
            {user?.username?.[0]?.toUpperCase() || "?"}
          </Text>
        </View>
      )}
      {hasPresenceStatus ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: dotSize,
            height: dotSize,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isOnline ? (
            <Animated.View
              style={{
                position: "absolute",
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: dotColor,
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              }}
            />
          ) : null}
          <View
            style={{
              width: visibleDotSize,
              height: visibleDotSize,
              borderRadius: visibleDotSize / 2,
              backgroundColor: dotColor,
              borderWidth: dotBorderWidth,
              borderColor: dotBorderColor,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
