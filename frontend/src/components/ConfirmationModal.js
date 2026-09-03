import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalization } from "../context/LocalizationContext";
import { useTheme } from "../context/ThemeContext";

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  icon = "alert-circle-outline",
  onConfirm,
  onCancel,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  const accentColor = danger ? colors.danger : colors.primary;
  const resolvedConfirmLabel = confirmLabel || t("commonConfirm");
  const resolvedCancelLabel = cancelLabel || t("commonCancel");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <BlurView
        tint={isDark ? "dark" : "light"}
        intensity={55}
        style={StyleSheet.absoluteFillObject}
      />
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: colors.overlay,
        }}
      >
        <View
          onStartShouldSetResponder={() => true}
          style={{
            marginHorizontal: 24,
            marginBottom: Math.max(insets.bottom + 10, 24),
            borderRadius: 26,
            overflow: "hidden",
            backgroundColor: colors.cardGlass,
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
                backgroundColor: danger ? colors.dangerSoft : colors.accent,
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

          <View style={[divider, { backgroundColor: colors.divider }]} />
          <Pressable onPress={onConfirm} style={actionRow}>
            <Text style={[actionText, { color: accentColor }]}>
              {resolvedConfirmLabel}
            </Text>
            <Ionicons name="checkmark-outline" size={21} color={accentColor} />
          </Pressable>
          <View style={[divider, { backgroundColor: colors.divider }]} />
          <Pressable onPress={onCancel} style={actionRow}>
            <Text style={[actionText, { color: colors.text }]}>
              {resolvedCancelLabel}
            </Text>
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
  fontSize: 15,
  fontWeight: "800",
};

const divider = {
  height: 1,
};
