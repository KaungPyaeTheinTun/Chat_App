import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmationModal from "../../components/ConfirmationModal";
import ConversationItem from "../../components/ConversationItem";
import UserAvatar from "../../components/UserAvatar";
import { useToast } from "../../components/ToastProvider";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";
import { conversationPreview } from "../../utils/formatters";

const MENU_REACTIONS = ["🔥", "🙌", "😭", "🙈", "🙏", "😬", "✨", "＋"];

export default function ChatListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { showSuccess } = useToast();
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
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
  const scrollY = useRef(new Animated.Value(0)).current;

  const usersWithoutConversation = useMemo(() => {
    const usedIds = new Set(
      conversations.map((item) => item.otherUser?.userId),
    );
    return users.filter((item) => !usedIds.has(item.userId));
  }, [users, conversations]);

  const storyUsers = useMemo(() => users.slice(0, 8), [users]);
  const collapsedStoryUsers = useMemo(() => users.slice(0, 2), [users]);
  const storyHeight = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: [128, 0],
    extrapolate: "clamp",
  });
  const storyOpacity = scrollY.interpolate({
    inputRange: [0, 45, 90],
    outputRange: [1, 0.35, 0],
    extrapolate: "clamp",
  });
  const storyTranslateY = scrollY.interpolate({
    inputRange: [0, 90],
    outputRange: [0, -18],
    extrapolate: "clamp",
  });
  const expandedTitleOpacity = scrollY.interpolate({
    inputRange: [0, 16],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const collapsedTitleOpacity = scrollY.interpolate({
    inputRange: [18, 28],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const collapsedTitleTranslateX = scrollY.interpolate({
    inputRange: [18, 28],
    outputRange: [-6, 0],
    extrapolate: "clamp",
  });

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
          ? t("chatListLeaveGroup")
          : t("chatListDeleteConversation"),
      message:
        conversation.conversationType === "group"
          ? t("chatListLeaveGroupConfirm")
          : t("chatListDeleteConversationConfirm"),
      confirmLabel:
        conversation.conversationType === "group"
          ? t("chatListLeave")
          : t("commonDelete"),
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
    showSuccess(t("chatReactionSoon", { reaction }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 8,
          backgroundColor: colors.background,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, height: 52, justifyContent: "center" }}>
          <Animated.Text
            style={{
              position: "absolute",
              opacity: expandedTitleOpacity,
              fontSize: 26,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t("appName")}
          </Animated.Text>
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: collapsedTitleOpacity,
              transform: [{ translateX: collapsedTitleTranslateX }],
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ width: 88, height: 42, marginRight: 10 }}>
              {collapsedStoryUsers.map((item, index) => (
                <View
                  key={item.userId}
                  style={{
                    position: "absolute",
                    left: index * 28,
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    borderWidth: 3,
                    borderColor: isDark ? "#38bdf8" : "#77df8b",
                    overflow: "hidden",
                    backgroundColor: colors.card,
                  }}
                >
                  <UserAvatar user={item} size={42} />
                </View>
              ))}
              <View
                style={{
                  position: "absolute",
                  left: collapsedStoryUsers.length ? 56 : 0,
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: isDark ? "#38bdf8" : "#77df8b",
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "900" }}>
                  {Math.max(storyUsers.length - collapsedStoryUsers.length, 0)}
                </Text>
              </View>
            </View>
            <Text
              style={{ color: colors.text, fontSize: 26, fontWeight: "700" }}
            >
              {t("appName")}
            </Text>
          </Animated.View>
        </View>
        <Pressable
          onPress={() => navigation.navigate("SearchScreen")}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.cardGlass,
            shadowColor: "#000000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Ionicons name="search-outline" size={20} color={colors.text} />
        </Pressable>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          minHeight: height,
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshChatData} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            height: storyHeight,
            opacity: storyOpacity,
            overflow: "hidden",
            transform: [{ translateY: storyTranslateY }],
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 18 }}
          >
            <View style={{ alignItems: "center", marginRight: 16 }}>
              <Pressable
                onPress={() => showSuccess(t("chatListMyDaySoon"))}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.cardGlass,
                }}
              >
                <Ionicons name="add" size={26} color={colors.subtext} />
              </Pressable>
              <Text
                style={{ marginTop: 8, fontSize: 12, color: colors.subtext }}
              >
                {t("chatListMyDay")}
              </Text>
            </View>

            {storyUsers.map((item) => (
              <Pressable
                key={item.userId}
                onPress={() => handleOpenConversation(item)}
                style={{ alignItems: "center", width: 82, marginRight: 10 }}
              >
                <UserAvatar user={item} size={64} />
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 8,
                    width: 82,
                    fontSize: 12,
                    textAlign: "center",
                    color: colors.text,
                  }}
                >
                  {item.username}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

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
          <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>
            {t("chatListChats")}
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
              <Ionicons
                name="ellipsis-horizontal"
                size={22}
                color={colors.subtext}
              />
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
                  backgroundColor: colors.card,
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
                  <Text style={[headerMenuText, { color: colors.text }]}>
                    {t("chatListCreateGroup")}
                  </Text>
                  <Ionicons
                    name="people-outline"
                    size={19}
                    color={colors.text}
                  />
                </Pressable>
                <View
                  style={[popupDivider, { backgroundColor: colors.divider }]}
                />
                <Pressable
                  onPress={() => {
                    setShowChatsMenu(false);
                    navigation.navigate("UserSearchScreen");
                  }}
                  style={headerMenuItem}
                >
                  <Text style={[headerMenuText, { color: colors.text }]}>
                    {t("commonSearchUsername")}
                  </Text>
                  <Ionicons
                    name="person-add-outline"
                    size={19}
                    color={colors.text}
                  />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={{
            marginTop: 10,
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
              <Text style={{ color: colors.subtext }}>
                {t("chatListEmpty")}
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
              backgroundColor: colors.cardGlass,
            }}
          >
            <Text style={{ fontWeight: "700", color: colors.text }}>
              {t("chatListStartNewChat")}
            </Text>
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
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {item.username}
                  </Text>
                  <Text style={{ marginTop: 4, color: colors.subtext }}>
                    {item.status === "online"
                      ? t("commonActiveNow")
                      : t("commonOffline")}
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
              onPress={() => setSelectedConversation(null)}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundColor: colors.overlay,
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
                  backgroundColor: colors.card,
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
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <UserAvatar
                      user={
                        selectedConversation.conversationType === "group"
                          ? {
                              username:
                                selectedConversation.title ||
                                t("commonGroupChat"),
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
                          color: colors.text,
                          fontSize: 16,
                          fontWeight: "800",
                        }}
                      >
                        {selectedConversation.conversationType === "group"
                          ? selectedConversation.title || t("commonGroupChat")
                          : selectedConversation.otherUser?.username ||
                            t("commonConversation")}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          marginTop: 4,
                          color: colors.subtext,
                          fontSize: 13,
                        }}
                      >
                        {conversationPreview(selectedConversation, t)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 13,
                      fontWeight: "800",
                    }}
                  >
                    {t("chatListReact")}
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

                <View
                  style={[popupDivider, { backgroundColor: colors.divider }]}
                />
                {[
                  {
                    label: selectedConversation.isPinned
                      ? t("chatListUnpin")
                      : t("chatListPin"),
                    icon: "pin-outline",
                    onPress: () =>
                      togglePreference(selectedConversation, "isPinned"),
                  },
                  {
                    label: selectedConversation.isMuted
                      ? t("chatListUnmute")
                      : t("chatListMute"),
                    icon: "notifications-off-outline",
                    onPress: () =>
                      togglePreference(selectedConversation, "isMuted"),
                  },
                  {
                    label: t("chatListArchive"),
                    icon: "archive-outline",
                    onPress: () =>
                      togglePreference(selectedConversation, "isArchived"),
                  },
                  {
                    label:
                      selectedConversation.conversationType === "group"
                        ? t("chatListLeaveGroup")
                        : t("chatListDeleteConversation"),
                    icon: "trash-outline",
                    danger: true,
                    onPress: () =>
                      handleLeaveConversation(selectedConversation),
                  },
                ].map((action, index, items) => (
                  <View key={action.label}>
                    <Pressable onPress={action.onPress} style={popupAction}>
                      <Text
                        style={[
                          popupActionText,
                          {
                            color: action.danger ? colors.danger : colors.text,
                          },
                        ]}
                      >
                        {action.label}
                      </Text>
                      <Ionicons
                        name={action.icon}
                        size={20}
                        color={action.danger ? colors.danger : colors.subtext}
                      />
                    </Pressable>
                    {index < items.length - 1 ? (
                      <View
                        style={[
                          popupDivider,
                          { backgroundColor: colors.divider },
                        ]}
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
      </Animated.ScrollView>
    </View>
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
  fontSize: 15,
  fontWeight: "700",
};

const popupDivider = {
  height: 1,
};

const headerMenuItem = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 14,
  paddingVertical: 13,
};

const headerMenuText = {
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
