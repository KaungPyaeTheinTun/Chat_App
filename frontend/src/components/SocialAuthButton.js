import React from "react";
import { Pressable, Text, View } from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function SocialAuthButton({
  label,
  icon = "google",
  variant = "muted",
  onPress,
}) {
  const { colors } = useTheme();
  const iconMap = {
    google: <AntDesign name="google" size={18} color="#DB4437" />,
    github: <AntDesign name="github" size={18} color={colors.text} />,
    apple: <AntDesign name="apple1" size={18} color={colors.text} />,
    guest: <FontAwesome name="user-circle-o" size={18} color={colors.text} />,
  };
  const backgroundColor =
    variant === "primary"
      ? colors.primary
      : variant === "soft"
        ? colors.primarySoft
        : colors.surfaceMuted;

  const textColor = variant === "primary" ? colors.white : colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 28,
        backgroundColor,
      }}
    >
      <View style={{ marginRight: 10 }}>{iconMap[icon] || iconMap.google}</View>
      <Text style={{ color: textColor, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
