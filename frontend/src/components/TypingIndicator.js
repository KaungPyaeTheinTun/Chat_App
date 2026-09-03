import React from "react";
import { Text, View } from "react-native";
import { useLocalization } from "../context/LocalizationContext";
import { useTheme } from "../context/ThemeContext";

export default function TypingIndicator({ users = [] }) {
  const { colors } = useTheme();
  const { t } = useLocalization();

  if (!users.length) {
    return null;
  }

  const label =
    users.length === 1
      ? t("chatTypingOne", { name: users[0].username })
      : t("chatTypingMany", {
          names: users.map((user) => user.username).join(", "),
        });

  return (
    <View
      style={{
        alignSelf: "flex-start",
        marginLeft: 14,
        marginBottom: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          color: colors.subtext,
          fontStyle: "italic",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
