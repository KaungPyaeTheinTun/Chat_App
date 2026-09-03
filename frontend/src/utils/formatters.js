const parseAppDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const rawValue = String(value);
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawValue);
  const normalizedValue = rawValue.replace(" ", "T");

  return new Date(hasTimezone ? normalizedValue : `${normalizedValue}Z`);
};

export const formatTime = (value) => {
  if (!value) {
    return "";
  }

  return parseAppDate(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Yangon",
  });
};

export const formatDateLabel = (value) => {
  if (!value) {
    return "";
  }

  const date = parseAppDate(value);
  const today = new Date();
  const dateParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const todayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(today);
  const getPart = (parts, type) =>
    Number(parts.find((part) => part.type === type)?.value);
  const isToday =
    getPart(dateParts, "year") === getPart(todayParts, "year") &&
    getPart(dateParts, "month") === getPart(todayParts, "month") &&
    getPart(dateParts, "day") === getPart(todayParts, "day");

  if (isToday) {
    return formatTime(value);
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Yangon",
  });
};

export const conversationPreview = (conversation, t) => {
  const lastMessage = conversation?.lastMessage;
  if (!lastMessage) {
    return t ? t("conversationPreviewStart") : "Start a conversation";
  }

  if (lastMessage.localStatus === "failed") {
    return t ? t("conversationPreviewFailed") : "Failed to send. Tap to retry.";
  }

  if (lastMessage.localStatus === "pending") {
    return t ? t("conversationPreviewSending") : "Sending...";
  }

  return lastMessage.messageType === "image"
    ? t
      ? t("commonPhoto")
      : "Photo"
    : lastMessage.content;
};
