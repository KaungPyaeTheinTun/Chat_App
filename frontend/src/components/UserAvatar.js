import React from "react";
import { Image, Text, View } from "react-native";
import { colors } from "../styles/colors";
import { resolveMediaUrl } from "../utils/media";

export default function UserAvatar({ user, size = 46 }) {
  const avatarUri = resolveMediaUrl(user?.avatarUrl);

  if (avatarUri) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
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
  );
}
