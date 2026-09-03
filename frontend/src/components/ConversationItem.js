import React from "react";
import { Pressable, Text, View } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import UserAvatar from "./UserAvatar";
import { useLocalization } from "../context/LocalizationContext";
import { useTheme } from "../context/ThemeContext";
import { conversationPreview, formatDateLabel } from "../utils/formatters";

export default function ConversationItem({
  conversation,
  onPress,
  onLongPress,
}) {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const otherUser = conversation.otherUser;
  const title =
    conversation.conversationType === "group"
      ? conversation.title || t("commonGroupChat")
      : otherUser?.username || t("commonConversation");
  const unreadCount = Number(conversation.unreadCount || 0);
  const isUnread = unreadCount > 0;
  const dateLabel = formatDateLabel(
    conversation.lastMessage?.createdAt || conversation.updatedAt,
  );

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => onLongPress?.(conversation)}
      delayLongPress={260}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 2,
        marginTop: 4,
      }}
    >
      <View style={{ marginRight: 14 }}>
        <UserAvatar
          user={
            conversation.conversationType === "group"
              ? { username: title, avatarUrl: conversation.avatarUrl }
              : otherUser
          }
          size={50}
        />
        <View
          style={{
            position: "absolute",
            right: 1,
            bottom: 1,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor:
              otherUser?.status === "online" ? "#41c95c" : "#d7dbe3",
            borderWidth: 2,
            borderColor: colors.background,
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            numberOfLines={1}
            style={{
              flexShrink: 1,
              fontSize: 17,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {title}
          </Text>
          {conversation.isMuted ? (
            <FontAwesome6
              name="volume-xmark"
              size={15}
              color={colors.subtext}
              style={{ marginLeft: 6 }}
            />
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 4,
            color: isUnread ? colors.text : colors.subtext,
            fontWeight: isUnread ? "600" : "400",
          }}
        >
          {conversationPreview(conversation, t)}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
        {conversation.isPinned ? (
          <View
            style={[pinDateBadge, { backgroundColor: colors.surfaceMuted }]}
          >
            <FontAwesome6 name="thumbtack" size={13} color={colors.subtext} />
            <Text style={[pinDateText, { color: colors.subtext }]}>
              {dateLabel}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              color: colors.subtext,
              fontSize: 11,
              fontWeight: isUnread ? "600" : "500",
            }}
          >
            {dateLabel}
          </Text>
        )}
        {isUnread ? (
          <View
            style={{
              minWidth: 23,
              height: 23,
              marginTop: conversation.isPinned ? 7 : 10,
              paddingHorizontal: 6,
              borderRadius: 11.5,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        ) : (
          <View style={{ height: 23, marginTop: 10 }} />
        )}
      </View>
    </Pressable>
  );
}

const pinDateBadge = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 8,
  paddingVertical: 5,
  borderRadius: 999,
};

const pinDateText = {
  marginLeft: 4,
  fontSize: 11,
  fontWeight: "700",
};
