import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmationModal from "../../components/ConfirmationModal";
import ConversationItem from "../../components/ConversationItem";
import UserAvatar from "../../components/UserAvatar";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";
import { conversationPreview } from "../../utils/formatters";

export default function GroupListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  const {
    conversations,
    openConversation,
    updateConversationPreferences,
    leaveConversation,
  } = useChat();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const groupConversations = useMemo(
    () => conversations.filter((item) => item.conversationType === "group"),
    [conversations],
  );

  const handleOpenGroup = async (conversation) => {
    await openConversation(conversation);
    navigation.navigate("ChatScreen", {
      title: conversation.title || t("commonGroupChat"),
      peerUser: conversation.otherUser,
    });
  };

  const togglePreference = async (conversation, key) => {
    await updateConversationPreferences(conversation.conversationId, {
      [key]: !conversation[key],
    });
    setSelectedGroup(null);
  };

  const handleLeaveGroup = (conversation) => {
    setSelectedGroup(null);
    setConfirmation({
      title: t("chatListLeaveGroup"),
      message: t("chatListLeaveGroupConfirm"),
      confirmLabel: t("chatListLeave"),
      icon: "exit-outline",
      onConfirm: async () => {
        setConfirmation(null);
        await leaveConversation(conversation.conversationId);
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            {t("groupsTitle")}
          </Text>
          <Text style={{ marginTop: 6, color: colors.subtext }}>
            {t("groupsSubtitle")}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate("CreateGroupScreen")}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.cardGlass,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="add" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {groupConversations.length ? (
          groupConversations.map((item) => (
            <ConversationItem
              key={item.conversationId}
              conversation={item}
              onPress={() => handleOpenGroup(item)}
              onLongPress={setSelectedGroup}
            />
          ))
        ) : (
          <View
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 24,
              backgroundColor: colors.cardGlass,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.subtext }}>{t("groupsEmpty")}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(selectedGroup)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={{ flex: 1 }}>
          <BlurView
            tint={isDark ? "dark" : "light"}
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
            onPress={() => setSelectedGroup(null)}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: colors.overlay,
            }}
          />

          {selectedGroup ? (
            <View
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                bottom: 30,
                borderRadius: 26,
                overflow: "hidden",
                backgroundColor: colors.card,
                shadowColor: "#000000",
                shadowOpacity: 0.2,
                shadowRadius: 30,
                shadowOffset: { width: 0, height: 18 },
                elevation: 14,
              }}
            >
              <View style={{ padding: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderRadius: 18,
                    backgroundColor: colors.surfaceMuted,
                  }}
                >
                  <UserAvatar
                    user={{
                      username: selectedGroup.title || t("commonGroupChat"),
                      avatarUrl: selectedGroup.avatarUrl,
                    }}
                    size={42}
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {selectedGroup.title || t("commonGroupChat")}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        marginTop: 4,
                        color: colors.subtext,
                        fontSize: 13,
                      }}
                    >
                      {conversationPreview(selectedGroup, t)}
                    </Text>
                  </View>
                </View>
              </View>

              {[
                {
                  label: selectedGroup.isPinned
                    ? t("chatListUnpin")
                    : t("chatListPin"),
                  icon: "thumbtack",
                  iconFamily: "fontawesome",
                  onPress: () => togglePreference(selectedGroup, "isPinned"),
                },
                {
                  label: selectedGroup.isMuted
                    ? t("chatListUnmute")
                    : t("chatListMute"),
                  icon: "notifications-off-outline",
                  onPress: () => togglePreference(selectedGroup, "isMuted"),
                },
                {
                  label: t("chatListArchive"),
                  icon: "archive-outline",
                  onPress: () => togglePreference(selectedGroup, "isArchived"),
                },
                {
                  label: t("chatListLeaveGroup"),
                  icon: "trash-outline",
                  danger: true,
                  onPress: () => handleLeaveGroup(selectedGroup),
                },
              ].map((action, index, items) => (
                <View key={action.label}>
                  <Pressable
                    onPress={action.onPress}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 18,
                      paddingVertical: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: action.danger ? colors.danger : colors.text,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {action.label}
                    </Text>
                    {action.iconFamily === "fontawesome" ? (
                      <FontAwesome6
                        name={action.icon}
                        size={18}
                        color={action.danger ? colors.danger : colors.subtext}
                      />
                    ) : (
                      <Ionicons
                        name={action.icon}
                        size={20}
                        color={action.danger ? colors.danger : colors.subtext}
                      />
                    )}
                  </Pressable>
                  {index < items.length - 1 ? (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.divider,
                      }}
                    />
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
    </View>
  );
}
