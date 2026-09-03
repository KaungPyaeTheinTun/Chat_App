import React, { useRef } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { formatTime } from "../utils/formatters";
import { resolveMediaUrl } from "../utils/media";

export default function MessageBubble({
  message,
  isMine,
  onLongPress,
  onPressImage,
  onRetry,
  interactive = true,
  containerStyle,
  bubbleStyle,
}) {
  const { colors } = useTheme();
  const didLongPressRef = useRef(false);
  const imageUri =
    message.messageType === "image" ? resolveMediaUrl(message.content) : null;

  return (
    <View
      style={{
        alignItems: isMine ? "flex-end" : "flex-start",
        marginVertical: 4,
        paddingHorizontal: 8,
        ...(containerStyle || {}),
      }}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => {
          if (!interactive) {
            return;
          }

          if (didLongPressRef.current) {
            didLongPressRef.current = false;
            return;
          }

          if (imageUri) {
            onPressImage?.(message, imageUri);
          }
        }}
        onLongPress={(event) => {
          if (!interactive) {
            return;
          }

          didLongPressRef.current = true;
          onLongPress?.(message, isMine, event?.nativeEvent || {});
        }}
        onPressOut={() => {
          setTimeout(() => {
            didLongPressRef.current = false;
          }, 250);
        }}
        delayLongPress={360}
        style={{
          maxWidth: "82%",
          paddingHorizontal: imageUri ? 6 : 14,
          paddingVertical: imageUri ? 6 : 10,
          borderRadius: 20,
          borderTopRightRadius: isMine ? 8 : 20,
          borderTopLeftRadius: isMine ? 20 : 8,
          backgroundColor: isMine ? colors.bubbleMine : colors.bubbleOther,
          borderWidth: isMine ? 0 : 1,
          borderColor: colors.border,
          shadowColor: "#000000",
          shadowOpacity: isMine ? 0.08 : 0.06,
          shadowRadius: isMine ? 10 : 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: isMine ? 3 : 4,
          ...(bubbleStyle || {}),
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{
              width: 220,
              height: 220,
              borderRadius: 16,
              backgroundColor: colors.border,
            }}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={{
              color: isMine ? colors.white : colors.text,
              lineHeight: 20,
              fontSize: 15,
            }}
          >
            {message.content}
          </Text>
        )}

        <View
          style={{
            marginTop: 8,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: isMine ? "rgba(255,255,255,0.82)" : colors.subtext,
              fontSize: 11,
            }}
          >
            {formatTime(message.createdAt)}
          </Text>

          {isMine ? (
            message.localStatus === "failed" ? (
              <Pressable
                onPress={() => onRetry?.(message)}
                style={{ marginLeft: 6 }}
              >
                <Ionicons name="refresh-circle" size={17} color="#ffe1e1" />
              </Pressable>
            ) : message.localStatus === "pending" ? (
              <Ionicons
                name="time-outline"
                size={14}
                color="rgba(255,255,255,0.68)"
                style={{ marginLeft: 6 }}
              />
            ) : (
              <Ionicons
                name={
                  message.deliveryState === "read" || message.isRead
                    ? "checkmark-done"
                    : "checkmark"
                }
                size={14}
                color={
                  message.deliveryState === "read" || message.isRead
                    ? "rgba(255,255,255,0.88)"
                    : "rgba(255,255,255,0.68)"
                }
                style={{ marginLeft: 6 }}
              />
            )
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );
}
