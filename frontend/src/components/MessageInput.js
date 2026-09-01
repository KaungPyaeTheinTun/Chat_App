import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../styles/colors";

const CHAT_BLUE = "#3b82f6";
const CHAT_INPUT_BG = "#ffffff";
const CHAT_BORDER = "#e6ebf2";
const CHAT_SUBTEXT = "#8b93a5";

export default function MessageInput({
  value,
  onChangeText,
  onPrimaryAction,
  onImageAction,
  onCancelEdit,
  isEditing = false,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: "#f6f7fb",
      }}
    >
      <View style={composerShell}>
        <Pressable
          onPress={isEditing ? onCancelEdit : onImageAction}
          style={iconButton}
        >
          <Ionicons
            name={isEditing ? "close" : "add"}
            size={22}
            color={CHAT_BLUE}
          />
        </Pressable>

        <View style={inputShell}>
          {isEditing ? <Text style={editingLabel}>Editing message</Text> : null}
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={isEditing ? "Edit message" : "Text message"}
            placeholderTextColor={CHAT_SUBTEXT}
            multiline
            style={inputStyle}
          />
        </View>

        <Pressable onPress={onPrimaryAction} style={sendButton}>
          <Ionicons
            name={isEditing ? "checkmark" : "paper-plane"}
            size={18}
            color={colors.white}
          />
        </Pressable>
      </View>
    </View>
  );
}

const composerShell = {
  flexDirection: "row",
  alignItems: "flex-end",
};

const iconButton = {
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: CHAT_BORDER,
};

const inputShell = {
  flex: 1,
  minHeight: 48,
  marginHorizontal: 10,
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 24,
  backgroundColor: CHAT_INPUT_BG,
  borderWidth: 1,
  borderColor: CHAT_BORDER,
  justifyContent: "center",
};

const editingLabel = {
  marginBottom: 4,
  color: CHAT_BLUE,
  fontSize: 11,
  fontWeight: "700",
};

const inputStyle = {
  minHeight: 24,
  maxHeight: 110,
  paddingVertical: 0,
  color: colors.text,
  fontSize: 15,
};

const sendButton = {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: CHAT_BLUE,
  shadowColor: "#000000",
  shadowOpacity: 0.14,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 5,
};
