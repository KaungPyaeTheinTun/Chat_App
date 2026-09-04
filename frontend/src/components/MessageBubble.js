import React, { useRef } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalization } from "../context/LocalizationContext";
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
  const { t } = useLocalization();
  const didLongPressRef = useRef(false);
  const imageUri =
    message.messageType === "image" ? resolveMediaUrl(message.content) : null;
  const repliedMessage = message.repliedMessage;
  const forwardedFromMessage = message.forwardedFromMessage;
  const quoteText =
    repliedMessage?.messageType === "image"
      ? t("commonPhoto")
      : repliedMessage?.content;
  const renderMineStatus = ({
    failedColor = "#ffe1e1",
    pendingColor = "rgba(255,255,255,0.68)",
    sentColor = "rgba(255,255,255,0.68)",
    readColor = "rgba(255,255,255,0.88)",
  } = {}) => {
    if (!isMine) {
      return null;
    }

    if (message.localStatus === "failed") {
      return (
        <Pressable onPress={() => onRetry?.(message)} style={{ marginLeft: 6 }}>
          <Ionicons name="refresh-circle" size={17} color={failedColor} />
        </Pressable>
      );
    }

    if (message.localStatus === "pending") {
      return (
        <Ionicons
          name="time-outline"
          size={14}
          color={pendingColor}
          style={{ marginLeft: 6 }}
        />
      );
    }

    return (
      <Ionicons
        name={
          message.deliveryState === "read" || message.isRead
            ? "checkmark-done"
            : "checkmark"
        }
        size={14}
        color={
          message.deliveryState === "read" || message.isRead
            ? readColor
            : sentColor
        }
        style={{ marginLeft: 6 }}
      />
    );
  };

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
          paddingHorizontal: imageUri ? 0 : 14,
          paddingVertical: imageUri ? 0 : 10,
          borderRadius: 20,
          borderTopRightRadius: isMine ? 8 : 20,
          borderTopLeftRadius: isMine ? 20 : 8,
          backgroundColor: imageUri
            ? "transparent"
            : isMine
              ? colors.bubbleMine
              : colors.bubbleOther,
          borderWidth: imageUri || isMine ? 0 : 1,
          borderColor: imageUri ? "transparent" : colors.border,
          shadowColor: "#000000",
          shadowOpacity: imageUri ? 0 : isMine ? 0.08 : 0.06,
          shadowRadius: isMine ? 10 : 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: imageUri ? 0 : isMine ? 3 : 4,
          ...(bubbleStyle || {}),
        }}
      >
        {forwardedFromMessage ? (
          <View
            style={{
              marginBottom: 6,
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: imageUri
                ? "rgba(0,0,0,0.45)"
                : isMine
                  ? "rgba(255,255,255,0.16)"
                  : colors.surfaceMuted,
            }}
          >
            <Ionicons
              name="arrow-redo-outline"
              size={12}
              color={imageUri || isMine ? "#ffffff" : colors.subtext}
            />
            <Text
              style={{
                marginLeft: 4,
                color: imageUri || isMine ? "#ffffff" : colors.subtext,
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {t("chatForwarded")}
            </Text>
          </View>
        ) : null}

        {repliedMessage ? (
          <View
            style={{
              marginBottom: 6,
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 12,
              borderLeftWidth: 3,
              borderLeftColor: imageUri || isMine ? "#ffffff" : colors.primary,
              backgroundColor: imageUri
                ? "rgba(0,0,0,0.45)"
                : isMine
                  ? "rgba(255,255,255,0.16)"
                  : colors.surfaceMuted,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: imageUri || isMine ? "#ffffff" : colors.text,
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {t("chatReplyingTo")}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                marginTop: 2,
                color:
                  imageUri || isMine ? "rgba(255,255,255,0.8)" : colors.subtext,
                fontSize: 12,
              }}
            >
              {quoteText}
            </Text>
          </View>
        ) : null}

        {imageUri ? (
          <View>
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
            <View
              style={{
                position: "absolute",
                right: 8,
                bottom: 8,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.46)",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                {formatTime(message.createdAt)}
              </Text>
              {renderMineStatus({
                failedColor: "#ffffff",
                pendingColor: "rgba(255,255,255,0.82)",
                sentColor: "rgba(255,255,255,0.82)",
                readColor: "#ffffff",
              })}
            </View>
          </View>
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

        {!imageUri ? (
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
            {renderMineStatus()}
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}
