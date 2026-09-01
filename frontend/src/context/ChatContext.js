import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { conversationsApi, messagesApi, usersApi } from "../services/api";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const ChatContext = createContext(null);

const sortConversations = (items) =>
  [...items].sort((left, right) => {
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
    (item) =>
      item.conversationId === nextConversation.conversationId &&
      item.conversationId !== null,
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

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { on, off, emit } = useSocket();
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [typingByConversation, setTypingByConversation] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
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
      setConversations(nextConversations);
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
    setTypingByConversation({});
    setActiveConversation(null);
  }, [isAuthenticated]);

  const mergeIncomingMessage = (conversationId, message) => {
    setMessagesByConversation((current) => {
      const existing = current[conversationId] || [];
      const alreadyPresent = existing.some(
        (entry) => entry.messageId === message.messageId,
      );

      if (alreadyPresent) {
        return current;
      }

      return {
        ...current,
        [conversationId]: [...existing, message],
      };
    });

    const otherUserId =
      message.senderId === user?.userId ? message.receiverId : message.senderId;
    const otherUser = usersById[otherUserId];

    setConversations((current) => {
      const existingConversation = current.find(
        (item) => item.conversationId === conversationId,
      );
      const shouldIncrementUnread =
        message.senderId !== user?.userId &&
        activeConversation?.conversationId !== conversationId;

      return upsertConversation(current, {
        conversationId,
        otherUser,
        lastMessageId: message.messageId,
        lastMessage: message,
        updatedAt: message.updatedAt || message.createdAt,
        unreadCount: shouldIncrementUnread
          ? (existingConversation?.unreadCount || 0) + 1
          : 0,
      });
    });
  };

  useEffect(() => {
    const handleReceiveMessage = ({ conversationId, message }) => {
      mergeIncomingMessage(conversationId, message);
    };

    const handleMessageUpdated = ({ conversationId, message }) => {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: (current[conversationId] || []).map((item) =>
          item.messageId === message.messageId ? message : item,
        ),
      }));
      mergeIncomingMessage(conversationId, message);
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
          item.receiverId === user?.userId ? item : { ...item, isRead: true },
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
  }, [activeConversation, off, on, user, usersById]);

  const loadMessages = async (conversationId) => {
    if (!conversationId) {
      return [];
    }

    const messages = await messagesApi.list(conversationId);
    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: messages,
    }));
    return messages;
  };

  const openConversation = async (conversationLike) => {
    const peerUser = conversationLike.otherUser || conversationLike;
    const existingConversation =
      conversationLike.conversationId != null
        ? conversationLike
        : conversations.find(
            (item) => item.otherUser?.userId === peerUser.userId,
          ) || {
            conversationId: null,
            otherUser: peerUser,
            lastMessage: null,
          };

    if (activeConversation?.conversationId) {
      emit("conversation:leave", {
        conversationId: activeConversation.conversationId,
      });
    }

    setActiveConversation(existingConversation);

    if (existingConversation.conversationId) {
      setConversations((current) =>
        current.map((item) =>
          item.conversationId === existingConversation.conversationId
            ? { ...item, unreadCount: 0 }
            : item,
        ),
      );
    }

    if (existingConversation.conversationId) {
      emit("conversation:join", {
        conversationId: existingConversation.conversationId,
      });
      await loadMessages(existingConversation.conversationId);
      await messagesApi.markRead(existingConversation.conversationId);
      emit("message:read", {
        conversationId: existingConversation.conversationId,
      });
    }
  };

  const sendMessage = async ({ receiverId, content, messageType = "text" }) => {
    const response = await messagesApi.send({
      receiverId,
      content,
      messageType,
    });
    mergeIncomingMessage(response.conversationId, response.message);

    setActiveConversation((current) =>
      current && current.otherUser?.userId === receiverId
        ? { ...current, conversationId: response.conversationId }
        : current,
    );

    return response;
  };

  const sendImageMessage = async ({ receiverId, asset }) => {
    const response = await messagesApi.sendImage(receiverId, asset);
    mergeIncomingMessage(response.conversationId, response.message);

    setActiveConversation((current) =>
      current && current.otherUser?.userId === receiverId
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

  const value = useMemo(
    () => ({
      users,
      conversations,
      activeConversation,
      activeMessages: activeConversation?.conversationId
        ? messagesByConversation[activeConversation.conversationId] || []
        : [],
      typingUsers: activeConversation?.conversationId
        ? (typingByConversation[activeConversation.conversationId] || [])
            .map((id) => usersById[id])
            .filter(Boolean)
        : [],
      searchResults,
      isLoading,
      refreshChatData,
      openConversation,
      loadMessages,
      sendMessage,
      sendImageMessage,
      editMessage,
      deleteMessage,
      searchMessages,
      startTyping,
      stopTyping,
    }),
    [
      users,
      conversations,
      activeConversation,
      messagesByConversation,
      typingByConversation,
      usersById,
      searchResults,
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
