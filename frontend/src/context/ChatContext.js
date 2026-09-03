import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  conversationsApi,
  createClientMessageId,
  messagesApi,
  usersApi,
} from "../services/api";
import { useToast } from "../components/ToastProvider";
import { useLocalization } from "./LocalizationContext";
import { formatTime } from "../utils/formatters";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const ChatContext = createContext(null);
const NOTIFICATION_SETTINGS_KEY = "chatapp.notificationSettings";

const sortConversations = (items) =>
  [...items].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return left.isPinned ? -1 : 1;
    }

    const leftTime = new Date(
      left.lastMessage?.createdAt || left.updatedAt || 0,
    ).getTime();
    const rightTime = new Date(
      right.lastMessage?.createdAt || right.updatedAt || 0,
    ).getTime();
    return rightTime - leftTime;
  });

const upsertConversation = (list, nextConversation) => {
  const existingIndex = list.findIndex(
    (item) => item.conversationId === nextConversation.conversationId,
  );

  if (existingIndex === -1) {
    return sortConversations([nextConversation, ...list.filter(Boolean)]);
  }

  const updated = [...list];
  updated[existingIndex] = {
    ...updated[existingIndex],
    ...nextConversation,
  };
  return sortConversations(updated);
};

const buildOptimisticMessage = ({
  senderId,
  receiverId,
  conversationId,
  content,
  messageType,
  clientMessageId,
}) => ({
  messageId: `local-${clientMessageId}`,
  clientMessageId,
  conversationId,
  senderId,
  receiverId,
  content,
  messageType,
  deliveryState: "pending",
  localStatus: "pending",
  createdAt: new Date().toISOString(),
});

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showMessageNotification } = useToast();
  const { t } = useLocalization();
  const { on, off, emit } = useSocket();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [paginationByConversation, setPaginationByConversation] = useState({});
  const [typingByConversation, setTypingByConversation] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    muteAll: false,
    mutedUserIds: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const usersById = useMemo(
    () =>
      users.reduce((accumulator, current) => {
        accumulator[current.userId] = current;
        return accumulator;
      }, {}),
    [users],
  );

  const refreshChatData = async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    try {
      const [nextUsers, nextConversations] = await Promise.all([
        usersApi.list(),
        conversationsApi.list(),
      ]);

      setUsers(nextUsers);
      setConversations(sortConversations(nextConversations));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshChatData();
      return;
    }

    setUsers([]);
    setConversations([]);
    setMessagesByConversation({});
    setPaginationByConversation({});
    setTypingByConversation({});
    setActiveConversation(null);
    setNotificationSettings({ muteAll: false, mutedUserIds: [] });
  }, [isAuthenticated]);

  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (!user?.userId) {
        return;
      }

      const raw = await AsyncStorage.getItem(
        `${NOTIFICATION_SETTINGS_KEY}:${user.userId}`,
      );
      if (raw) {
        setNotificationSettings(JSON.parse(raw));
      }
    };

    loadNotificationSettings();
  }, [user?.userId]);

  const persistNotificationSettings = async (nextSettings) => {
    setNotificationSettings(nextSettings);
    if (user?.userId) {
      await AsyncStorage.setItem(
        `${NOTIFICATION_SETTINGS_KEY}:${user.userId}`,
        JSON.stringify(nextSettings),
      );
    }
  };

  const setMuteAllNotifications = async (muteAll) => {
    await persistNotificationSettings({
      ...notificationSettings,
      muteAll,
    });
  };

  const toggleUserNotificationMute = async (userId) => {
    const targetUserId = Number(userId);
    const mutedUserIds = notificationSettings.mutedUserIds.includes(
      targetUserId,
    )
      ? notificationSettings.mutedUserIds.filter((id) => id !== targetUserId)
      : [...notificationSettings.mutedUserIds, targetUserId];

    await persistNotificationSettings({
      ...notificationSettings,
      mutedUserIds,
    });
  };

  const updateConversationFromMessage = (conversationId, message) => {
    const otherUserId =
      message.senderId === user?.userId ? message.receiverId : message.senderId;
    const otherUser = usersById[otherUserId];
    const shouldIncrementUnread =
      message.senderId !== user?.userId &&
      activeConversation?.conversationId !== conversationId;

    setConversations((current) => {
      const existing = current.find(
        (item) => item.conversationId === conversationId,
      );
      return upsertConversation(current, {
        conversationId,
        conversationType: existing?.conversationType || "direct",
        otherUser: existing?.otherUser || otherUser,
        members: existing?.members,
        title: existing?.title,
        isPinned: existing?.isPinned || false,
        isMuted: existing?.isMuted || false,
        lastMessageId: message.messageId,
        lastMessage: message,
        updatedAt: message.updatedAt || message.createdAt,
        unreadCount: shouldIncrementUnread
          ? (existing?.unreadCount || 0) + 1
          : 0,
      });
    });
  };

  const mergeIncomingMessage = (conversationId, message) => {
    setMessagesByConversation((current) => {
      const existing = current[conversationId] || [];
      const withoutDuplicate = existing.filter(
        (entry) =>
          entry.messageId !== message.messageId &&
          entry.clientMessageId !== message.clientMessageId,
      );

      return {
        ...current,
        [conversationId]: [
          ...withoutDuplicate,
          { ...message, localStatus: "sent" },
        ].sort((left, right) => {
          const leftTime = new Date(left.createdAt || 0).getTime();
          const rightTime = new Date(right.createdAt || 0).getTime();
          return leftTime - rightTime;
        }),
      };
    });

    updateConversationFromMessage(conversationId, message);
  };

  useEffect(() => {
    const handleReceiveMessage = ({ conversationId, message }) => {
      mergeIncomingMessage(conversationId, message);
      const shouldShowMessageNotification =
        message.senderId !== user?.userId &&
        !notificationSettings.muteAll &&
        !notificationSettings.mutedUserIds.includes(Number(message.senderId));

      if (shouldShowMessageNotification) {
        const existingConversation = conversations.find(
          (item) => item.conversationId === conversationId,
        );
        const sender = usersById[message.senderId] ||
          existingConversation?.otherUser || {
            username: t("chatNotificationNewMessage"),
          };

        showMessageNotification({
          title:
            existingConversation?.conversationType === "group"
              ? t("chatNotificationGroupTitle", {
                  sender: sender.username,
                  group: existingConversation.title || t("commonGroupChat"),
                })
              : sender.username || t("chatNotificationNewMessage"),
          message:
            message.messageType === "image"
              ? t("chatNotificationSentPhoto")
              : message.content,
          time: formatTime(message.createdAt || new Date().toISOString()),
          avatarUser: sender,
        });
      }
      if (conversationId === activeConversation?.conversationId) {
        messagesApi.markDelivered(conversationId).catch(() => {});
      }
    };

    const handleMessageUpdated = ({ conversationId, message }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((item) =>
          item.messageId === message.messageId ? { ...item, ...message } : item,
        ),
      }));
      updateConversationFromMessage(conversationId, message);
    };

    const handleMessageDeleted = ({ conversationId, messageId }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).filter(
          (item) => item.messageId !== messageId,
        ),
      }));
      refreshChatData();
    };

    const handleTyping = ({ conversationId, userId }) => {
      if (userId === user?.userId) {
        return;
      }

      setTypingByConversation((current) => ({
        ...current,
        [conversationId]: Array.from(
          new Set([...(current[conversationId] || []), userId]),
        ),
      }));
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      setTypingByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).filter(
          (id) => id !== userId,
        ),
      }));
    };

    const handlePresence = ({ userId, status }) => {
      setUsers((current) =>
        current.map((item) =>
          item.userId === userId ? { ...item, status } : item,
        ),
      );
      setConversations((current) =>
        current.map((item) =>
          item.otherUser?.userId === userId
            ? { ...item, otherUser: { ...item.otherUser, status } }
            : item,
        ),
      );
    };

    const handleMessageRead = ({ conversationId, userId: readerId }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((item) =>
          item.senderId === user?.userId && readerId !== user?.userId
            ? { ...item, deliveryState: "read", isRead: true }
            : item,
        ),
      }));

      if (readerId === user?.userId) {
        setConversations((current) =>
          current.map((item) =>
            item.conversationId === conversationId
              ? { ...item, unreadCount: 0 }
              : item,
          ),
        );
      }
    };

    on("message:received", handleReceiveMessage);
    on("message:updated", handleMessageUpdated);
    on("message:deleted", handleMessageDeleted);
    on("typing:start", handleTyping);
    on("typing:stop", handleStopTyping);
    on("presence:changed", handlePresence);
    on("message:read", handleMessageRead);

    return () => {
      off("message:received", handleReceiveMessage);
      off("message:updated", handleMessageUpdated);
      off("message:deleted", handleMessageDeleted);
      off("typing:start", handleTyping);
      off("typing:stop", handleStopTyping);
      off("presence:changed", handlePresence);
      off("message:read", handleMessageRead);
    };
  }, [
    activeConversation,
    conversations,
    notificationSettings,
    off,
    on,
    showMessageNotification,
    t,
    user,
    usersById,
  ]);

  const loadMessages = async (conversationId, options = {}) => {
    if (!conversationId) {
      return [];
    }

    const response = await messagesApi.list(conversationId, {
      limit: options.limit || 30,
      beforeMessageId: options.beforeMessageId,
    });
    const messages = response.messages || [];

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: options.beforeMessageId
        ? [...messages, ...(current[conversationId] || [])]
        : messages,
    }));
    setPaginationByConversation((current) => ({
      ...current,
      [conversationId]: {
        nextCursor: response.nextCursor,
        hasMore: response.hasMore,
      },
    }));

    return messages;
  };

  const loadOlderMessages = async (conversationId) => {
    const pagination = paginationByConversation[conversationId];
    if (!pagination?.hasMore || !pagination.nextCursor) {
      return [];
    }

    return loadMessages(conversationId, {
      beforeMessageId: pagination.nextCursor,
    });
  };

  const openConversation = async (conversationLike) => {
    const peerUser = conversationLike.otherUser || conversationLike;
    let existingConversation =
      conversationLike.conversationId != null
        ? conversationLike
        : conversations.find(
            (item) => item.otherUser?.userId === peerUser.userId,
          );

    if (!existingConversation?.conversationId && peerUser?.userId) {
      existingConversation = await conversationsApi.createDirect(
        peerUser.userId,
      );
      await refreshChatData();
    }

    if (activeConversation?.conversationId) {
      emit("conversation:leave", {
        conversationId: activeConversation.conversationId,
      });
    }

    setActiveConversation(existingConversation);

    if (existingConversation?.conversationId) {
      emit("conversation:join", {
        conversationId: existingConversation.conversationId,
      });
      await loadMessages(existingConversation.conversationId);
      await messagesApi.markRead(existingConversation.conversationId);
      emit("message:read", {
        conversationId: existingConversation.conversationId,
      });
      setConversations((current) =>
        current.map((item) =>
          item.conversationId === existingConversation.conversationId
            ? { ...item, unreadCount: 0 }
            : item,
        ),
      );
    }
  };

  const sendMessage = async ({
    receiverId,
    conversationId = activeConversation?.conversationId,
    content,
    messageType = "text",
    clientMessageId = createClientMessageId(),
  }) => {
    const optimisticConversationId = conversationId || `pending-${receiverId}`;
    const optimistic = buildOptimisticMessage({
      senderId: user.userId,
      receiverId,
      conversationId: optimisticConversationId,
      content,
      messageType,
      clientMessageId,
    });

    setMessagesByConversation((current) => ({
      ...current,
      [optimisticConversationId]: [
        ...(current[optimisticConversationId] || []),
        optimistic,
      ],
    }));

    try {
      const response = await messagesApi.send({
        receiverId,
        conversationId,
        content,
        messageType,
        clientMessageId,
      });
      mergeIncomingMessage(response.conversationId, response.message);

      if (optimisticConversationId !== response.conversationId) {
        setMessagesByConversation((current) => {
          const { [optimisticConversationId]: _removed, ...rest } = current;
          return rest;
        });
      }

      setActiveConversation((current) =>
        current &&
        (current.otherUser?.userId === receiverId || current.conversationId)
          ? { ...current, conversationId: response.conversationId }
          : current,
      );

      return response;
    } catch (error) {
      setMessagesByConversation((current) => ({
        ...current,
        [optimisticConversationId]: (
          current[optimisticConversationId] || []
        ).map((item) =>
          item.clientMessageId === clientMessageId
            ? { ...item, localStatus: "failed", deliveryState: "failed" }
            : item,
        ),
      }));
      throw error;
    }
  };

  const retryMessage = async (message) => {
    return sendMessage({
      receiverId: message.receiverId,
      conversationId:
        typeof message.conversationId === "number"
          ? message.conversationId
          : null,
      content: message.content,
      messageType: message.messageType,
      clientMessageId: message.clientMessageId,
    });
  };

  const sendImageMessage = async ({
    receiverId,
    conversationId = activeConversation?.conversationId,
    asset,
    clientMessageId = createClientMessageId(),
  }) => {
    const response = await messagesApi.sendImage({
      receiverId,
      conversationId,
      asset,
      clientMessageId,
    });
    mergeIncomingMessage(response.conversationId, response.message);

    setActiveConversation((current) =>
      current &&
      (current.otherUser?.userId === receiverId || current.conversationId)
        ? { ...current, conversationId: response.conversationId }
        : current,
    );

    return response;
  };

  const editMessage = async (messageId, content) => {
    const response = await messagesApi.edit(messageId, { content });
    const { conversationId, message } = response;

    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: (current[conversationId] || []).map((item) =>
        item.messageId === message.messageId ? message : item,
      ),
    }));
  };

  const deleteMessage = async (messageId) => {
    const response = await messagesApi.remove(messageId);
    setMessagesByConversation((current) => ({
      ...current,
      [response.conversationId]: (
        current[response.conversationId] || []
      ).filter((item) => item.messageId !== messageId),
    }));
    await refreshChatData();
  };

  const createGroupConversation = async ({ title, memberIds }) => {
    const conversation = await conversationsApi.createGroup({
      title,
      memberIds,
    });
    await refreshChatData();
    return conversation;
  };

  const updateConversationPreferences = async (conversationId, preferences) => {
    await conversationsApi.updatePreferences(conversationId, preferences);
    setConversations((current) =>
      sortConversations(
        current
          .map((item) =>
            item.conversationId === conversationId
              ? { ...item, ...preferences }
              : item,
          )
          .filter((item) => !item.isDeleted),
      ),
    );
  };

  const leaveConversation = async (conversationId) => {
    await conversationsApi.leave(conversationId);
    setConversations((current) =>
      current.filter((item) => item.conversationId !== conversationId),
    );
    if (activeConversation?.conversationId === conversationId) {
      setActiveConversation(null);
    }
  };

  const replaceConversation = (conversation) => {
    setConversations((current) => upsertConversation(current, conversation));
    setActiveConversation((current) =>
      current?.conversationId === conversation.conversationId
        ? { ...current, ...conversation }
        : current,
    );
  };

  const updateGroupProfile = async (conversationId, payload) => {
    const conversation = await conversationsApi.updateGroupProfile(
      conversationId,
      payload,
    );
    replaceConversation(conversation);
    return conversation;
  };

  const uploadGroupAvatar = async (conversationId, asset) => {
    const conversation = await conversationsApi.uploadGroupAvatar(
      conversationId,
      asset,
    );
    replaceConversation(conversation);
    return conversation;
  };

  const addGroupMembers = async (conversationId, memberIds) => {
    const conversation = await conversationsApi.addMembers(
      conversationId,
      memberIds,
    );
    replaceConversation(conversation);
    return conversation;
  };

  const removeGroupMember = async (conversationId, memberId) => {
    const conversation = await conversationsApi.removeMember(
      conversationId,
      memberId,
    );
    replaceConversation(conversation);
    return conversation;
  };

  const searchMessages = async (query) => {
    if (!query?.trim()) {
      setSearchResults([]);
      return [];
    }

    const results = await messagesApi.search(query.trim());
    setSearchResults(results);
    return results;
  };

  const startTyping = (conversationId) => {
    if (conversationId) {
      emit("typing:start", { conversationId });
    }
  };

  const stopTyping = (conversationId) => {
    if (conversationId) {
      emit("typing:stop", { conversationId });
    }
  };

  const activeConversationId = activeConversation?.conversationId;
  const value = useMemo(
    () => ({
      users,
      conversations,
      activeConversation,
      activeMessages: activeConversationId
        ? messagesByConversation[activeConversationId] || []
        : [],
      activePagination: activeConversationId
        ? paginationByConversation[activeConversationId] || {}
        : {},
      typingUsers: activeConversationId
        ? (typingByConversation[activeConversationId] || [])
            .map((id) => usersById[id])
            .filter(Boolean)
        : [],
      searchResults,
      notificationSettings,
      isLoading,
      refreshChatData,
      openConversation,
      loadMessages,
      loadOlderMessages,
      sendMessage,
      retryMessage,
      sendImageMessage,
      editMessage,
      deleteMessage,
      createGroupConversation,
      updateConversationPreferences,
      leaveConversation,
      updateGroupProfile,
      uploadGroupAvatar,
      addGroupMembers,
      removeGroupMember,
      setMuteAllNotifications,
      toggleUserNotificationMute,
      searchMessages,
      startTyping,
      stopTyping,
    }),
    [
      users,
      conversations,
      activeConversation,
      activeConversationId,
      messagesByConversation,
      paginationByConversation,
      typingByConversation,
      usersById,
      searchResults,
      notificationSettings,
      isLoading,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside ChatProvider.");
  }

  return context;
};
