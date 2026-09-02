import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmationModal from "../../components/ConfirmationModal";
import ConversationItem from "../../components/ConversationItem";
import UserAvatar from "../../components/UserAvatar";
import { useToast } from "../../components/ToastProvider";
import { useChat } from "../../context/ChatContext";
import { conversationPreview } from "../../utils/formatters";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "#ffffff";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const MENU_REACTIONS = ["🔥", "🙌", "😭", "🙈", "🙏", "😬", "✨", "＋"];

export default function ChatListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showSuccess } = useToast();
  const {
    conversations,
    users,
    refreshChatData,
    isLoading,
    openConversation,
    updateConversationPreferences,
    leaveConversation,
  } = useChat();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatsMenu, setShowChatsMenu] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  const usersWithoutConversation = useMemo(() => {
    const usedIds = new Set(
      conversations.map((item) => item.otherUser?.userId),
    );
    return users.filter((item) => !usedIds.has(item.userId));
  }, [users, conversations]);

  const storyUsers = useMemo(() => users.slice(0, 8), [users]);

  const handleOpenConversation = async (item) => {
    await openConversation(item);
    navigation.navigate("ChatScreen", {
      title: item.otherUser?.username || item.username,
      peerUser: item.otherUser || item,
    });
  };

  const togglePreference = async (conversation, key) => {
    await updateConversationPreferences(conversation.conversationId, {
      [key]: !conversation[key],
    });
    setSelectedConversation(null);
  };

  const handleLeaveConversation = async (conversation) => {
    setSelectedConversation(null);
    setConfirmation({
      title:
        conversation.conversationType === "group"
          ? "Leave group"
          : "Delete conversation",
      message:
        conversation.conversationType === "group"
          ? "Are you sure you want to leave this group?"
          : "Are you sure you want to delete this conversation from your chat list?",
      confirmLabel:
        conversation.conversationType === "group" ? "Leave" : "Delete",
      icon:
        conversation.conversationType === "group"
          ? "exit-outline"
          : "trash-outline",
      onConfirm: async () => {
        setConfirmation(null);
        await leaveConversation(conversation.conversationId);
      },
    });
  };

  const handleReactionPress = (reaction) => {
    setSelectedConversation(null);
    showSuccess(`${reaction} reactions will be available soon.`);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PAGE_BG }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 18,
        paddingBottom: 30,
      }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshChatData} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: "800", color: TEXT }}>
          ChatApp
        </Text>
        <Pressable
          onPress={() => navigation.navigate("SearchScreen")}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: CARD_BG,
            shadowColor: "#000000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Ionicons name="search-outline" size={20} color={TEXT} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 8 }}
      >
        <View style={{ alignItems: "center", marginRight: 16 }}>
          <Pressable
            onPress={() =>
              showSuccess("MyDay feature will be available later.")
            }
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: "#d0d6e2",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CARD_BG,
            }}
          >
            <Ionicons name="add" size={26} color={SUBTEXT} />
          </Pressable>
          <Text style={{ marginTop: 8, fontSize: 12, color: SUBTEXT }}>
            MyDay
          </Text>
        </View>

        {storyUsers.map((item) => (
          <Pressable
            key={item.userId}
            onPress={() => handleOpenConversation(item)}
            style={{ alignItems: "center", marginRight: 16 }}
          >
            <UserAvatar user={item} size={64} />
            <Text
              numberOfLines={1}
              style={{ marginTop: 8, maxWidth: 68, fontSize: 12, color: TEXT }}
            >
              {item.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30,
          elevation: 30,
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: TEXT }}>
          Chats
        </Text>
        <View>
          <Pressable
            onPress={() => setShowChatsMenu((current) => !current)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={SUBTEXT} />
          </Pressable>
          {showChatsMenu ? (
            <View
              style={{
                position: "absolute",
                top: 38,
                right: 0,
                zIndex: 20,
                width: 210,
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: CARD_BG,
                shadowColor: "#000000",
                shadowOpacity: 0.14,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 8,
              }}
            >
              <Pressable
                onPress={() => {
                  setShowChatsMenu(false);
                  navigation.navigate("CreateGroupScreen");
                }}
                style={headerMenuItem}
              >
                <Text style={headerMenuText}>Create Group</Text>
                <Ionicons name="people-outline" size={19} color={TEXT} />
              </Pressable>
              <View style={popupDivider} />
              <Pressable
                onPress={() => {
                  setShowChatsMenu(false);
                  navigation.navigate("UserSearchScreen");
                }}
                style={headerMenuItem}
              >
                <Text style={headerMenuText}>Search Username</Text>
                <Ionicons name="person-add-outline" size={19} color={TEXT} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={{
          marginTop: 18,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 28,
          backgroundColor: CARD_BG,
          shadowColor: "#000000",
          shadowOpacity: 0.04,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
        }}
      >
        {conversations.length ? (
          conversations.map((item) => (
            <View key={item.conversationId}>
              <ConversationItem
                conversation={item}
                onPress={() => handleOpenConversation(item)}
                onLongPress={setSelectedConversation}
              />
            </View>
          ))
        ) : (
          <View style={{ paddingVertical: 20 }}>
            <Text style={{ color: SUBTEXT }}>
              No conversations yet. Start one below.
            </Text>
          </View>
        )}
      </View>

      {usersWithoutConversation.length ? (
        <View
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 24,
            backgroundColor: CARD_BG,
          }}
        >
          <Text style={{ fontWeight: "700", color: TEXT }}>Start New Chat</Text>
          {usersWithoutConversation.map((item) => (
            <Pressable
              key={item.userId}
              onPress={() => handleOpenConversation(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 14,
              }}
            >
              <UserAvatar user={item} size={48} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: TEXT, fontWeight: "700" }}>
                  {item.username}
                </Text>
                <Text style={{ marginTop: 4, color: SUBTEXT }}>
                  {item.status}
                </Text>
              </View>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor:
                    item.status === "online" ? "#41c95c" : "#d7dbe3",
                }}
              />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Modal
        visible={Boolean(selectedConversation)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedConversation(null)}
      >
        <View style={{ flex: 1 }}>
          <BlurView
            tint="light"
            intensity={80}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
          <Pressable
            onPress={() => setSelectedConversation(null)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(255,255,255,0.22)",
            }}
          />

          {selectedConversation ? (
            <View
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                bottom: 30,
                borderRadius: 26,
                overflow: "hidden",
                backgroundColor: "#ffffff",
                shadowColor: "#000000",
                shadowOpacity: 0.2,
                shadowRadius: 30,
                shadowOffset: { width: 0, height: 18 },
                elevation: 14,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingTop: 14,
                  paddingBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderRadius: 18,
                    backgroundColor: "#f5f6f8",
                  }}
                >
                  <UserAvatar
                    user={
                      selectedConversation.conversationType === "group"
                        ? {
                            username:
                              selectedConversation.title || "Group chat",
                            avatarUrl: selectedConversation.avatarUrl,
                          }
                        : selectedConversation.otherUser
                    }
                    size={42}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: TEXT,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {selectedConversation.conversationType === "group"
                        ? selectedConversation.title || "Group chat"
                        : selectedConversation.otherUser?.username ||
                          "Conversation"}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ marginTop: 4, color: SUBTEXT, fontSize: 13 }}
                    >
                      {conversationPreview(selectedConversation)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
                <Text
                  style={{
                    color: "#2d3038",
                    fontSize: 13,
                    fontWeight: "800",
                  }}
                >
                  React
                </Text>
                <View
                  style={{
                    marginTop: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {MENU_REACTIONS.map((reaction) => (
                    <Pressable
                      key={reaction}
                      onPress={() => handleReactionPress(reaction)}
                      style={popupReactionButton}
                    >
                      <Text style={popupReactionText}>{reaction}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={popupDivider} />
              {[
                {
                  label: selectedConversation.isPinned ? "Unpin" : "Pin",
                  icon: "pin-outline",
                  onPress: () =>
                    togglePreference(selectedConversation, "isPinned"),
                },
                {
                  label: selectedConversation.isMuted ? "Unmute" : "Mute",
                  icon: "notifications-off-outline",
                  onPress: () =>
                    togglePreference(selectedConversation, "isMuted"),
                },
                {
                  label: "Archive",
                  icon: "archive-outline",
                  onPress: () =>
                    togglePreference(selectedConversation, "isArchived"),
                },
                {
                  label:
                    selectedConversation.conversationType === "group"
                      ? "Leave group"
                      : "Delete conversation",
                  icon: "trash-outline",
                  danger: true,
                  onPress: () => handleLeaveConversation(selectedConversation),
                },
              ].map((action, index, items) => (
                <View key={action.label}>
                  <Pressable onPress={action.onPress} style={popupAction}>
                    <Text
                      style={[
                        popupActionText,
                        action.danger ? { color: "#ef4444" } : null,
                      ]}
                    >
                      {action.label}
                    </Text>
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={action.danger ? "#ef4444" : SUBTEXT}
                    />
                  </Pressable>
                  {index < items.length - 1 ? (
                    <View style={popupDivider} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Modal>
      <ConfirmationModal
        visible={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        danger
        icon={confirmation?.icon}
        onConfirm={confirmation?.onConfirm}
        onCancel={() => setConfirmation(null)}
      />
    </ScrollView>
  );
}

const popupAction = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 18,
  paddingVertical: 16,
};

const popupActionText = {
  color: TEXT,
  fontSize: 15,
  fontWeight: "700",
};

const popupDivider = {
  height: 1,
  backgroundColor: "rgba(60,60,67,0.14)",
};

const headerMenuItem = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 14,
  paddingVertical: 13,
};

const headerMenuText = {
  color: TEXT,
  fontSize: 14,
  fontWeight: "700",
};

const popupReactionButton = {
  width: 28,
  height: 32,
  alignItems: "center",
  justifyContent: "center",
};

const popupReactionText = {
  fontSize: 21,
};
