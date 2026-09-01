import React from "react";
import { Text, View } from "react-native";
import { colors } from "../styles/colors";

export default function TypingIndicator({ users = [] }) {
  if (!users.length) {
    return null;
  }

  const label =
    users.length === 1
      ? `${users[0].username} is typing...`
      : `${users.map((user) => user.username).join(", ")} are typing...`;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        marginLeft: 14,
        marginBottom: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#edf1f6",
      }}
    >
      <Text
        style={{
          color: "#8b93a5",
          fontStyle: "italic",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
