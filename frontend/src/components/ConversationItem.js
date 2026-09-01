import React from "react";
import { Pressable, Text, View } from "react-native";
import UserAvatar from "./UserAvatar";
import { conversationPreview, formatDateLabel } from "../utils/formatters";

const CHAT_BLUE = "#3b82f6";
const CHAT_TEXT = "#16181d";
const CHAT_SUBTEXT = "#7f8796";
const CHAT_ROW_BG = "#ffffff";

export default function ConversationItem({ conversation, onPress }) {
  const otherUser = conversation.otherUser;
  const unreadCount = Number(conversation.unreadCount || 0);
  const isUnread = unreadCount > 0;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 2,
        marginTop: 10,
      }}
    >
      <View style={{ marginRight: 14 }}>
        <UserAvatar user={otherUser} size={54} />
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
            borderColor: CHAT_ROW_BG,
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontWeight: "700", color: CHAT_TEXT }}>
          {otherUser?.username || "Unknown user"}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 4,
            color: isUnread ? CHAT_TEXT : CHAT_SUBTEXT,
            fontWeight: isUnread ? "600" : "400",
          }}
        >
          {conversationPreview(conversation)}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
        <Text
          style={{
            color: isUnread ? CHAT_SUBTEXT : "#a0a7b4",
            fontSize: 11,
            fontWeight: isUnread ? "600" : "500",
          }}
        >
          {formatDateLabel(
            conversation.lastMessage?.createdAt || conversation.updatedAt,
          )}
        </Text>
        {isUnread ? (
          <View
            style={{
              minWidth: 23,
              height: 23,
              marginTop: 10,
              paddingHorizontal: 6,
              borderRadius: 11.5,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CHAT_BLUE,
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
