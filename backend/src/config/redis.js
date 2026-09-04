const { createClient } = require("redis");

class RedisClient {
  constructor() {
    if (RedisClient.instance) {
      return RedisClient.instance;
    }

    this.memory = new Map();
    this.client = null;
    this.isConnected = false;
    this.connectPromise = null;

    RedisClient.instance = this;
  }

  async connect() {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    if (!process.env.REDIS_HOST) {
      return false;
    }

    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    this.client.on("error", () => {
      this.isConnected = false;
    });

    this.connectPromise = this.client
      .connect()
      .then(() => {
        this.isConnected = true;
        return true;
      })
      .catch(() => {
        this.isConnected = false;
        return false;
      });

    return this.connectPromise;
  }

  async get(key) {
    if (await this.connect()) {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    }

    const cached = this.memory.get(key);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt && cached.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }

    return cached.value;
  }

  async set(key, value, ttlSeconds = 300) {
    if (await this.connect()) {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return;
    }

    this.memory.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key) {
    if (await this.connect()) {
      await this.client.del(key);
      return;
    }

    this.memory.delete(key);
  }

  async incr(key, ttlSeconds = 300) {
    if (await this.connect()) {
      const nextValue = await this.client.incr(key);
      if (nextValue === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return nextValue;
    }

    const current = await this.get(key);
    const nextValue = Number(current || 0) + 1;
    this.memory.set(key, {
      value: nextValue,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return nextValue;
  }

  static getInstance() {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }

    return RedisClient.instance;
  }
}

module.exports = RedisClient;
