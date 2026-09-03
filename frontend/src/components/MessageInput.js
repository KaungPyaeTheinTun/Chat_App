import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalization } from "../context/LocalizationContext";
import { useTheme } from "../context/ThemeContext";

export default function MessageInput({
  value,
  onChangeText,
  onPrimaryAction,
  onImageAction,
  onCancelEdit,
  isEditing = false,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const hasText = Boolean(value.trim());

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <View style={composerShell}>
        <Pressable
          onPress={isEditing ? onCancelEdit : onImageAction}
          style={iconButton}
        >
          <Ionicons
            name={isEditing ? "close" : "add"}
            size={23}
            color={colors.subtext}
          />
        </Pressable>

        <View style={[inputShell, { backgroundColor: colors.input }]}>
          {isEditing ? (
            <Text style={[editingLabel, { color: colors.primary }]}>
              {t("chatEditingMessage")}
            </Text>
          ) : null}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={
              isEditing ? t("chatEditMessagePlaceholder") : t("chatTextMessage")
            }
            placeholderTextColor={colors.subtext}
            multiline
            style={[inputStyle, { color: colors.text }]}
          />
          <Pressable
            onPress={hasText || isEditing ? onPrimaryAction : undefined}
            style={insideAction}
          >
            <Ionicons
              name={isEditing || hasText ? "arrow-up-circle" : "mic-outline"}
              size={22}
              color={isEditing || hasText ? colors.primary : colors.subtext}
            />
          </Pressable>
        </View>

        {!isEditing ? (
          <Pressable onPress={onImageAction} style={iconButton}>
            <Ionicons name="camera-outline" size={22} color={colors.subtext} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const composerShell = {
  flexDirection: "row",
  alignItems: "center",
};

const iconButton = {
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: "center",
  justifyContent: "center",
};

const inputShell = {
  flex: 1,
  minHeight: 38,
  marginHorizontal: 8,
  paddingLeft: 16,
  paddingRight: 6,
  paddingVertical: 5,
  borderRadius: 20,
  flexDirection: "row",
  alignItems: "center",
};

const editingLabel = {
  marginBottom: 4,
  fontSize: 11,
  fontWeight: "700",
};

const inputStyle = {
  flex: 1,
  minHeight: 24,
  maxHeight: 110,
  paddingVertical: 0,
  fontSize: 15,
};

const insideAction = {
  width: 32,
  height: 32,
  borderRadius: 16,
  alignItems: "center",
  justifyContent: "center",
};
