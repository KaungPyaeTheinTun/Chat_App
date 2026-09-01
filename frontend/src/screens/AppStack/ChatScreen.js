import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
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
import { BlurTargetView, BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MessageBubble from "../../components/MessageBubble";
import MessageInput from "../../components/MessageInput";
import TypingIndicator from "../../components/TypingIndicator";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { colors } from "../../styles/colors";
import { resolveMediaUrl } from "../../utils/media";

const MENU_WIDTH = 252;
const REACTION_BAR_HEIGHT = 54;
const ACTION_ROW_HEIGHT = 54;
const MENU_GAP = 12;
const STACK_GAP = 12;
const STACK_SIDE_PADDING = 16;
const REACTIONS = ["👍", "👎", "❤️", "🔥", "👏", "😮"];
const CHAT_BG = "#f4f6fb";
const CHAT_ICON = "#7a8292";

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const {
    activeConversation,
    activeMessages,
    typingUsers,
    sendMessage,
    sendImageMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  } = useChat();
  const peerUser = activeConversation?.otherUser || route.params?.peerUser;
  const blurTargetRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const composerTranslateY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const focusedMessageScale = useRef(new Animated.Value(0.94)).current;
  const focusedMessageTranslateY = useRef(new Animated.Value(18)).current;
  const sheetTranslateY = useRef(new Animated.Value(14)).current;
  const [selectedMessage, setSelectedMessage] = useState(null);
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

  useEffect(() => {
    if (!selectedMessage) {
      return;
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(focusedMessageScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
      }),
      Animated.spring(focusedMessageTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
      }),
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
        stiffness: 180,
        mass: 0.9,
      }),
    ]).start();
  }, [
    focusedMessageScale,
    focusedMessageTranslateY,
    overlayOpacity,
    selectedMessage,
    sheetTranslateY,
  ]);

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

  const closeMessageMenu = () => setSelectedMessage(null);
  const closeImageViewer = () => setViewerImage(null);
  const openImageViewer = (_message, imageUri) => setViewerImage(imageUri);

  const handlePrimaryAction = async () => {
    const content = composerValue.trim();

    if (!content) {
      return;
    }

    try {
      if (editingMessage) {
        await editMessage(editingMessage.messageId, content);
        showSuccess("Message updated.");
      } else {
        await sendMessage({
          receiverId: peerUser.userId,
          content,
          messageType: "text",
        });
      }

      resetComposer();
    } catch (error) {
      showError(
        getErrorMessage(
          error,
          editingMessage
            ? "Unable to edit message."
            : "Unable to send message.",
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
      showError("Photo library permission is required.");
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
        receiverId: peerUser.userId,
        asset: result.assets[0],
      });
    } catch (error) {
      showError(getErrorMessage(error, "Unable to send image."));
    }
  };

  const openMessageMenu = (message, isMine, nativeEvent) => {
    if (!message) {
      return;
    }

    overlayOpacity.setValue(0);
    focusedMessageScale.setValue(0.94);
    focusedMessageTranslateY.setValue(18);
    sheetTranslateY.setValue(14);

    setSelectedMessage({
      message,
      isMine,
      bubbleX: nativeEvent.bubbleX,
      bubbleY: nativeEvent.bubbleY,
      bubbleWidth: nativeEvent.bubbleWidth,
      bubbleHeight: nativeEvent.bubbleHeight,
    });
  };

  const beginEdit = () => {
    if (!selectedMessage?.message) {
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

    const messageToDelete = selectedMessage.message;
    closeMessageMenu();

    Alert.alert(
      "Delete message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessage(messageToDelete.messageId);
              showSuccess("Message deleted.");
            } catch (error) {
              showError(getErrorMessage(error, "Unable to delete message."));
            }
          },
        },
      ],
    );
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
    showSuccess(`${reaction} reactions will be available soon.`);
  };

  const menuActions = useMemo(() => {
    if (!selectedMessage?.message) {
      return [];
    }

    const actions = [];

    if (selectedMessage.message.messageType === "image") {
      actions.push({
        key: "open",
        label: "Open image",
        icon: "expand-outline",
        color: colors.text,
        onPress: openSelectedImage,
      });
    }

    if (
      selectedMessage.isMine &&
      selectedMessage.message.messageType !== "image"
    ) {
      actions.push({
        key: "edit",
        label: "Edit message",
        icon: "create-outline",
        color: colors.text,
        onPress: beginEdit,
      });
    }

    if (selectedMessage.isMine) {
      actions.push({
        key: "delete",
        label: "Delete message",
        icon: "trash-outline",
        color: colors.danger,
        onPress: confirmDelete,
      });
    }

    return actions;
  }, [selectedMessage]);

  const focusedLayout = useMemo(() => {
    if (!selectedMessage) {
      return null;
    }

    const bubbleWidth = selectedMessage.bubbleWidth || MENU_WIDTH;
    const bubbleHeight = selectedMessage.bubbleHeight || 0;
    const actionsHeight = menuActions.length * ACTION_ROW_HEIGHT;
    const stackHeight =
      REACTION_BAR_HEIGHT +
      STACK_GAP +
      bubbleHeight +
      (menuActions.length ? MENU_GAP + actionsHeight : 0);

    const desiredTop =
      (selectedMessage.bubbleY || 0) - REACTION_BAR_HEIGHT - STACK_GAP;
    const top = Math.min(
      Math.max(insets.top + 16, desiredTop),
      height - stackHeight - Math.max(insets.bottom, 24),
    );

    const bubbleLeft = Math.min(
      Math.max(
        STACK_SIDE_PADDING,
        selectedMessage.bubbleX || STACK_SIDE_PADDING,
      ),
      width - bubbleWidth - STACK_SIDE_PADDING,
    );
    const sheetLeft = selectedMessage.isMine
      ? Math.max(STACK_SIDE_PADDING, bubbleLeft + bubbleWidth - MENU_WIDTH)
      : Math.min(
          Math.max(STACK_SIDE_PADDING, bubbleLeft),
          width - MENU_WIDTH - STACK_SIDE_PADDING,
        );

    return {
      top,
      bubbleLeft,
      bubbleWidth,
      sheetLeft,
      reactionTop: 0,
      bubbleTop: REACTION_BAR_HEIGHT + STACK_GAP,
      actionTop: REACTION_BAR_HEIGHT + STACK_GAP + bubbleHeight + MENU_GAP,
    };
  }, [
    height,
    insets.bottom,
    insets.top,
    menuActions.length,
    selectedMessage,
    width,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: CHAT_BG }}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <View
          style={{
            paddingTop: insets.top + 6,
            paddingHorizontal: 16,
            paddingBottom: 10,
            backgroundColor: "#ffffff",
            borderBottomWidth: 1,
            borderBottomColor: "#edf1f6",
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
              <Ionicons name="chevron-back" size={24} color="#17191f" />
            </Pressable>

            <UserAvatar user={peerUser} size={42} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                style={{ fontSize: 17, fontWeight: "700", color: "#17191f" }}
              >
                {peerUser?.username}
              </Text>
              <Text style={{ marginTop: 3, color: CHAT_ICON, fontSize: 12 }}>
                {peerUser?.status === "online" ? "Active now" : "Offline"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={headerIconShell}>
                <Ionicons name="videocam-outline" size={20} color={CHAT_ICON} />
              </View>
              <View style={[headerIconShell, { marginLeft: 8 }]}>
                <Ionicons name="call-outline" size={18} color={CHAT_ICON} />
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
              isMine={item.senderId === user.userId}
              onPressImage={openImageViewer}
              onLongPress={openMessageMenu}
            />
          )}
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
                No messages yet. Start the conversation.
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
              marginHorizontal: 10,
              backgroundColor: CHAT_BG,
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
      </BlurTargetView>

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

      {selectedMessage && focusedLayout ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            zIndex: 100,
            elevation: 100,
          }}
        >
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              opacity: overlayOpacity,
            }}
          >
            <BlurView
              tint="light"
              intensity={100}
              blurTarget={blurTargetRef}
              blurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "rgba(255,255,255,0.22)",
              }}
            />
          </Animated.View>

          <Pressable
            onPress={closeMessageMenu}
            style={StyleSheet.absoluteFillObject}
          >
            <View />
          </Pressable>

          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              top: focusedLayout.top,
              left: 0,
              right: 0,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: focusedLayout.reactionTop,
                left: focusedLayout.sheetLeft,
                width: MENU_WIDTH,
                opacity: overlayOpacity,
                transform: [{ translateY: sheetTranslateY }],
              }}
            >
              <View style={reactionShadow}>
                <BlurView
                  tint="extraLight"
                  intensity={95}
                  blurTarget={blurTargetRef}
                  blurMethod="dimezisBlurView"
                  style={reactionBar}
                >
                  {REACTIONS.map((reaction) => (
                    <Pressable
                      key={reaction}
                      onPress={() => handleReactionPress(reaction)}
                      style={reactionButton}
                    >
                      <Text style={reactionText}>{reaction}</Text>
                    </Pressable>
                  ))}
                </BlurView>
              </View>
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: focusedLayout.bubbleTop,
                left: focusedLayout.bubbleLeft,
                width: focusedLayout.bubbleWidth,
                opacity: overlayOpacity,
                transform: [
                  { translateY: focusedMessageTranslateY },
                  { scale: focusedMessageScale },
                ],
              }}
            >
              <MessageBubble
                message={selectedMessage.message}
                isMine={selectedMessage.isMine}
                interactive={false}
                containerStyle={{
                  marginVertical: 0,
                  paddingHorizontal: 0,
                }}
                bubbleStyle={{
                  maxWidth: "100%",
                  shadowOpacity: 0.18,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 14 },
                  elevation: 10,
                }}
              />
            </Animated.View>

            {menuActions.length ? (
              <Animated.View
                style={{
                  position: "absolute",
                  top: focusedLayout.actionTop,
                  left: focusedLayout.sheetLeft,
                  width: MENU_WIDTH,
                  opacity: overlayOpacity,
                  transform: [{ translateY: sheetTranslateY }],
                }}
              >
                <View style={menuShadow}>
                  <BlurView
                    tint="extraLight"
                    intensity={98}
                    blurTarget={blurTargetRef}
                    blurMethod="dimezisBlurView"
                    style={actionCard}
                  >
                    {menuActions.map((action, index) => (
                      <View key={action.key}>
                        <Pressable onPress={action.onPress} style={menuItem}>
                          <Text style={[menuText, { color: action.color }]}>
                            {action.label}
                          </Text>
                          <Ionicons
                            name={action.icon}
                            size={18}
                            color={action.color}
                          />
                        </Pressable>
                        {index < menuActions.length - 1 ? (
                          <View style={menuDivider} />
                        ) : null}
                      </View>
                    ))}
                  </BlurView>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </View>
      ) : null}
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
  color: colors.text,
};

const menuDivider = {
  height: 1,
  backgroundColor: "rgba(60,60,67,0.14)",
};

const reactionShadow = {
  borderRadius: 28,
  overflow: "hidden",
  shadowColor: "#000000",
  shadowOpacity: 0.16,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 12 },
  elevation: 10,
};

const reactionBar = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 10,
  height: REACTION_BAR_HEIGHT,
  borderRadius: 28,
  backgroundColor: "rgba(255,255,255,0.82)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.75)",
};

const reactionButton = {
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: "center",
  justifyContent: "center",
};

const reactionText = {
  fontSize: 22,
};

const headerIconShell = {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f6f7fb",
};

const menuShadow = {
  borderRadius: 20,
  overflow: "hidden",
  shadowColor: "#000000",
  shadowOpacity: 0.16,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 16 },
  elevation: 10,
};

const actionCard = {
  borderRadius: 20,
  backgroundColor: "rgba(255,255,255,0.84)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.74)",
};
