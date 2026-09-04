module.exports = {
  API_PREFIX: "/api/v1",
  JWT_EXPIRATION:
    process.env.JWT_EXPIRATION || process.env.JWT_EXPIRES_IN || "24h",
  REFRESH_TOKEN_EXPIRATION:
    process.env.REFRESH_TOKEN_EXPIRATION ||
    process.env.REFRESH_TOKEN_EXPIRES_IN ||
    "7d",
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS || 10),
  MESSAGE_TYPE: {
    TEXT: "text",
    IMAGE: "image",
  },
  USER_STATUS: {
    ONLINE: "online",
    OFFLINE: "offline",
  },
  CACHE_KEYS: {
    USER_PROFILE: "user:profile:",
    USER_STATUS: "user:status:",
    USER_CONVERSATIONS: "user:conversations:",
    CONVERSATION_MESSAGES: "conversation:messages:",
    ALL_USERS: "users:all",
    RATE_LIMIT: "rate_limit:",
  },
  CACHE_EXPIRATION: {
    SHORT: 60,
    MEDIUM: 300,
    LONG: 3600,
  },
  MESSAGE_CACHE: {
    RECENT_LIMIT: 30,
    RECENT_TTL_SECONDS: Number(process.env.RECENT_MESSAGES_CACHE_TTL || 60),
  },
  MESSAGE_ARCHIVE: {
    HOT_RETENTION_DAYS: Number(process.env.MESSAGE_HOT_RETENTION_DAYS || 90),
    BATCH_SIZE: Number(process.env.MESSAGE_ARCHIVE_BATCH_SIZE || 500),
  },
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100,
  },
};
