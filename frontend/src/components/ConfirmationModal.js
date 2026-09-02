import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../styles/colors";

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  icon = "alert-circle-outline",
  onConfirm,
  onCancel,
}) {
  const insets = useSafeAreaInsets();
  const accentColor = danger ? colors.danger : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <BlurView
        tint="light"
        intensity={55}
        style={StyleSheet.absoluteFillObject}
      />
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      >
        <View
          onStartShouldSetResponder={() => true}
          style={{
            marginHorizontal: 24,
            marginBottom: Math.max(insets.bottom + 10, 24),
            borderRadius: 26,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.94)",
            shadowColor: "#000000",
            shadowOpacity: 0.2,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 18 },
            elevation: 14,
          }}
        >
          <View style={{ alignItems: "center", padding: 22 }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: danger ? "#fff1f2" : "#eff6ff",
              }}
            >
              <Ionicons name={icon} size={25} color={accentColor} />
            </View>
            <Text
              style={{
                marginTop: 14,
                color: colors.text,
                fontSize: 18,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: colors.subtext,
                lineHeight: 20,
                textAlign: "center",
              }}
            >
              {message}
            </Text>
          </View>

          <View style={divider} />
          <Pressable onPress={onConfirm} style={actionRow}>
            <Text style={[actionText, { color: accentColor }]}>
              {confirmLabel}
            </Text>
            <Ionicons name="checkmark-outline" size={21} color={accentColor} />
          </Pressable>
          <View style={divider} />
          <Pressable onPress={onCancel} style={actionRow}>
            <Text style={actionText}>{cancelLabel}</Text>
            <Ionicons name="close-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const actionRow = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 18,
  paddingVertical: 16,
};

const actionText = {
  color: colors.text,
  fontSize: 15,
  fontWeight: "800",
};

const divider = {
  height: 1,
  backgroundColor: "rgba(60,60,67,0.14)",
};
