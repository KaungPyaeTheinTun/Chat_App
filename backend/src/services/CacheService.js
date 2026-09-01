const RedisClient = require("../config/redis");
const { CACHE_EXPIRATION, CACHE_KEYS } = require("../config/constants");

class CacheService {
  constructor() {
    this.redis = RedisClient.getInstance();
  }

  async get(key) {
    return this.redis.get(key);
  }

  async set(key, value, ttl = CACHE_EXPIRATION.MEDIUM) {
    return this.redis.set(key, value, ttl);
  }

  async del(key) {
    return this.redis.del(key);
  }

  async incr(key, ttl = CACHE_EXPIRATION.SHORT) {
    return this.redis.incr(key, ttl);
  }

  userProfileKey(userId) {
    return `${CACHE_KEYS.USER_PROFILE}${userId}`;
  }

  userConversationsKey(userId) {
    return `${CACHE_KEYS.USER_CONVERSATIONS}${userId}`;
  }

  conversationMessagesKey(conversationId) {
    return `${CACHE_KEYS.CONVERSATION_MESSAGES}${conversationId}`;
  }
}

module.exports = CacheService;
