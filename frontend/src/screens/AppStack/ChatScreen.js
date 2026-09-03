import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmationModal from "../../components/ConfirmationModal";
import MessageBubble from "../../components/MessageBubble";
import MessageInput from "../../components/MessageInput";
import TypingIndicator from "../../components/TypingIndicator";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";
import { resolveMediaUrl } from "../../utils/media";

const REACTIONS = ["🔥", "🙌", "😭", "🙈", "🙏", "😬", "✨", "＋"];

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();
  const {
    activeConversation,
    activeMessages,
    activePagination,
    typingUsers,
    loadOlderMessages,
    sendMessage,
    sendImageMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  } = useChat();

  const peerUser = activeConversation?.otherUser || route.params?.peerUser;
  const conversationTitle =
    activeConversation?.conversationType === "group"
      ? activeConversation?.title || t("commonGroupChat")
      : peerUser?.username;
  const conversationAvatar =
    activeConversation?.conversationType === "group"
      ? {
          username: conversationTitle,
          avatarUrl: activeConversation?.avatarUrl,
        }
      : peerUser;
  const typingTimeoutRef = useRef(null);
  const composerTranslateY = useRef(new Animated.Value(0)).current;
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const [composerValue, setComposerValue] = useState("");
  const [composerHeight, setComposerHeight] = useState(118);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping(activeConversation?.conversationId);
    };
  }, [activeConversation, stopTyping]);

  useEffect(() => {
    const animateComposer = (toValue, duration = 220) => {
      Animated.timing(composerTranslateY, {
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    };

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event) => {
      const keyboardHeight = Math.max(
        0,
        (event?.endCoordinates?.height || 0) - insets.bottom,
      );
      animateComposer(-keyboardHeight, event?.duration || 220);
    };

    const handleHide = (event) => {
      animateComposer(0, event?.duration || 220);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [composerTranslateY, insets.bottom]);

  const closeMessageMenu = () => setSelectedMessage(null);
  const closeImageViewer = () => setViewerImage(null);
  const openImageViewer = (_message, imageUri) => setViewerImage(imageUri);
  const openConversationProfile = () => {
    navigation.navigate("ConversationProfileScreen", {
      conversationId: activeConversation?.conversationId,
      peerUser,
    });
  };

  const handleTyping = (text) => {
    setComposerValue(text);

    if (editingMessage || !activeConversation?.conversationId) {
      return;
    }

    if (text.trim()) {
      startTyping(activeConversation.conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeConversation.conversationId);
      }, 1200);
    } else {
      stopTyping(activeConversation.conversationId);
    }
  };

  const resetComposer = () => {
    setComposerValue("");
    setEditingMessage(null);
    stopTyping(activeConversation?.conversationId);
  };

  const handlePrimaryAction = async () => {
    const content = composerValue.trim();

    if (!content) {
      return;
    }

    try {
      if (editingMessage) {
        await editMessage(editingMessage.messageId, content);
        showSuccess(t("chatMessageUpdated"));
      } else {
        await sendMessage({
          receiverId: peerUser?.userId,
          conversationId: activeConversation?.conversationId,
          content,
          messageType: "text",
        });
      }

      resetComposer();
    } catch (error) {
      showError(
        getErrorMessage(
          error,
          editingMessage ? t("chatUnableEdit") : t("chatUnableSend"),
        ),
      );
    }
  };

  const handleImageAction = async () => {
    if (editingMessage) {
      resetComposer();
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showError(t("chatPhotoPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    try {
      await sendImageMessage({
        receiverId: peerUser?.userId,
        conversationId: activeConversation?.conversationId,
        asset: result.assets[0],
      });
    } catch (error) {
      showError(getErrorMessage(error, t("chatUnableSendImage")));
    }
  };

  const openMessageMenu = (message, isMine, nativeEvent) => {
    setSelectedMessage({
      message,
      isMine,
      anchorY: nativeEvent?.pageY || height * 0.48,
    });
  };

  const beginEdit = () => {
    if (!selectedMessage?.message) {
      return;
    }

    if (!selectedMessage.isMine) {
      closeMessageMenu();
      showError(t("chatOnlyEditOwn"));
      return;
    }

    setEditingMessage(selectedMessage.message);
    setComposerValue(selectedMessage.message.content);
    closeMessageMenu();
  };

  const confirmDelete = () => {
    if (!selectedMessage?.message) {
      return;
    }

    if (!selectedMessage.isMine) {
      closeMessageMenu();
      showError(t("chatOnlyDeleteOwn"));
      return;
    }

    const messageToDelete = selectedMessage.message;
    closeMessageMenu();

    setConfirmation({
      title: t("chatDeleteMessage"),
      message: t("chatDeleteMessageConfirm"),
      confirmLabel: t("commonDelete"),
      icon: "trash-outline",
      onConfirm: async () => {
        setConfirmation(null);
        try {
          await deleteMessage(messageToDelete.messageId);
          showSuccess(t("chatMessageDeleted"));
        } catch (error) {
          showError(getErrorMessage(error, t("chatUnableDelete")));
        }
      },
    });
  };

  const openSelectedImage = () => {
    const selectedImagePath =
      selectedMessage?.message?.messageType === "image"
        ? resolveMediaUrl(selectedMessage.message.content)
        : null;

    if (!selectedImagePath) {
      return;
    }

    closeMessageMenu();
    setViewerImage(selectedImagePath);
  };

  const handleReactionPress = (reaction) => {
    closeMessageMenu();
    showSuccess(t("chatReactionSoon", { reaction }));
  };

  const handlePendingAction = (label) => {
    closeMessageMenu();
    showSuccess(t("chatFeatureSoon", { label }));
  };

  const menuActions = useMemo(() => {
    if (!selectedMessage?.message) {
      return [];
    }

    const actions = [];

    if (selectedMessage.message.messageType === "image") {
      actions.push({
        key: "open",
        label: t("chatOpenImage"),
        icon: "expand-outline",
        color: colors.text,
        onPress: openSelectedImage,
      });
    }

    if (selectedMessage.message.messageType !== "image") {
      actions.push({
        key: "edit",
        label: t("chatEdit"),
        icon: "create-outline",
        color: colors.text,
        onPress: beginEdit,
      });
    }

    actions.push(
      {
        key: "copy",
        label: t("chatCopy"),
        icon: "copy-outline",
        color: colors.text,
        onPress: () => handlePendingAction(t("chatCopy")),
      },
      {
        key: "reply",
        label: t("chatReply"),
        icon: "return-up-back-outline",
        color: colors.text,
        onPress: () => handlePendingAction(t("chatReply")),
      },
      {
        key: "forward",
        label: t("chatForward"),
        icon: "arrow-redo-outline",
        color: colors.text,
        onPress: () => handlePendingAction(t("chatForward")),
      },
    );

    actions.push({
      key: "delete",
      label: t("commonDelete"),
      icon: "trash-outline",
      color: colors.danger,
      onPress: confirmDelete,
    });

    return actions;
  }, [colors.danger, colors.text, selectedMessage, t]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            paddingTop: insets.top + 6,
            paddingHorizontal: 16,
            paddingBottom: 10,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </Pressable>

            <Pressable onPress={openConversationProfile}>
              <UserAvatar user={conversationAvatar} size={42} />
            </Pressable>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                {conversationTitle}
              </Text>
              <Text
                style={{ marginTop: 3, color: colors.subtext, fontSize: 12 }}
              >
                {activeConversation?.conversationType === "group"
                  ? t("commonMembersCount", {
                      count: activeConversation?.members?.length || 0,
                    })
                  : peerUser?.status === "online"
                    ? t("commonActiveNow")
                    : t("commonOffline")}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  headerIconShell,
                  { backgroundColor: colors.iconSurface },
                ]}
              >
                <Ionicons
                  name="videocam-outline"
                  size={20}
                  color={colors.subtext}
                />
              </View>
              <View
                style={[
                  headerIconShell,
                  { marginLeft: 8, backgroundColor: colors.iconSurface },
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.subtext}
                />
              </View>
            </View>
          </View>
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={activeMessages}
          keyExtractor={(item) => String(item.messageId)}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingTop: 10,
            paddingBottom: composerHeight + 16,
          }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMine={item.senderId === user?.userId}
              onPressImage={openImageViewer}
              onRetry={retryMessage}
              onLongPress={openMessageMenu}
            />
          )}
          ListHeaderComponent={
            activePagination?.hasMore ? (
              <Pressable
                onPress={() =>
                  loadOlderMessages(activeConversation.conversationId)
                }
                style={{
                  alignSelf: "center",
                  marginBottom: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.subtext, fontWeight: "700" }}>
                  {t("chatLoadOlder")}
                </Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <View
              style={{
                marginHorizontal: 14,
                marginTop: 20,
                padding: 18,
                borderRadius: 18,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: colors.subtext,
                  lineHeight: 20,
                }}
              >
                {t("chatEmpty")}
              </Text>
            </View>
          }
        />

        <Animated.View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight && nextHeight !== composerHeight) {
              setComposerHeight(nextHeight);
            }
          }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateY: composerTranslateY }],
            backgroundColor: "transparent",
          }}
        >
          <TypingIndicator users={editingMessage ? [] : typingUsers} />
          <View
            style={{
              backgroundColor: colors.surface,
            }}
          >
            <MessageInput
              value={composerValue}
              onChangeText={handleTyping}
              onPrimaryAction={handlePrimaryAction}
              onImageAction={handleImageAction}
              onCancelEdit={resetComposer}
              isEditing={Boolean(editingMessage)}
            />
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={Boolean(viewerImage)}
        transparent
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.96)",
          }}
        >
          <Pressable
            onPress={closeImageViewer}
            style={{
              position: "absolute",
              top: insets.top + 14,
              right: 18,
              zIndex: 2,
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.14)",
            }}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </Pressable>

          <Pressable
            onPress={closeImageViewer}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 12,
              paddingVertical: Math.max(insets.top + 60, 84),
            }}
          >
            {viewerImage ? (
              <Image
                source={{ uri: viewerImage }}
                style={{
                  width: width - 24,
                  height:
                    height - Math.max(insets.top + insets.bottom + 110, 150),
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedMessage)}
        transparent
        animationType="fade"
        onRequestClose={closeMessageMenu}
      >
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={55}
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable
          onPress={closeMessageMenu}
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: colors.overlay,
          }}
        >
          <View
            onStartShouldSetResponder={() => true}
            style={{
              marginHorizontal: 28,
              marginBottom: Math.max(insets.bottom + 10, 24),
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
            {selectedMessage?.message ? (
              <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
                <View
                  style={{
                    alignSelf: selectedMessage.isMine
                      ? "flex-end"
                      : "flex-start",
                    maxWidth: "96%",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 16,
                    backgroundColor: colors.surfaceMuted,
                  }}
                >
                  <Text
                    numberOfLines={3}
                    style={{
                      color: colors.text,
                      lineHeight: 19,
                      fontWeight: "500",
                    }}
                  >
                    {selectedMessage.message.messageType === "image"
                      ? t("commonImageMessage")
                      : selectedMessage.message.content}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
              <Text
                style={{
                  color: colors.text,
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
                {REACTIONS.map((reaction) => (
                  <Pressable
                    key={reaction}
                    onPress={() => handleReactionPress(reaction)}
                    style={sheetReactionButton}
                  >
                    <Text style={sheetReactionText}>{reaction}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginTop: 6 }}>
              <View
                style={[menuDivider, { backgroundColor: colors.divider }]}
              />
            </View>
            {menuActions.map((action, index) => (
              <View key={action.key}>
                <Pressable onPress={action.onPress} style={menuItem}>
                  <Text style={[menuText, { color: action.color }]}>
                    {action.label}
                  </Text>
                  <Ionicons name={action.icon} size={20} color={action.color} />
                </Pressable>
                {index < menuActions.length - 1 ? (
                  <View
                    style={[menuDivider, { backgroundColor: colors.divider }]}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Pressable>
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

const menuItem = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 18,
  paddingVertical: 16,
};

const menuText = {
  fontSize: 15,
  fontWeight: "600",
};

const menuDivider = {
  height: 1,
};

const sheetReactionButton = {
  width: 28,
  height: 32,
  alignItems: "center",
  justifyContent: "center",
};

const sheetReactionText = {
  fontSize: 21,
};

const headerIconShell = {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
};
