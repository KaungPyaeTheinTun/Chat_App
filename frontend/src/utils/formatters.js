export const formatTime = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateLabel = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

export const conversationPreview = (conversation) => {
  const lastMessage = conversation?.lastMessage;
  if (!lastMessage) {
    return "Start a conversation";
  }

  return lastMessage.messageType === "image" ? "[Image]" : lastMessage.content;
};
