const fs = require("fs/promises");
const path = require("path");
const BaseService = require("./base/BaseService");
const User = require("../models/entities/User");
const ValidationException = require("../exceptions/ValidationException");

const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

class UserService extends BaseService {
  constructor({
    userRepository,
    deviceTokenRepository,
    conversationMemberRepository = null,
    cacheService,
    logger,
  }) {
    super({
      repository: userRepository,
      entityClass: User,
      cacheService,
      logger,
      notFoundMessage: "User not found.",
    });
    this.userRepository = userRepository;
    this.deviceTokenRepository = deviceTokenRepository;
    this.conversationMemberRepository = conversationMemberRepository;
  }

  async getUserById(userId) {
    const key = this.cacheService.userProfileKey(userId);
    const cached = await this.cacheService.get(key);
    if (cached) {
      return cached;
    }

    const userRecord = await this.getByIdOrFail(userId);
    const user = this.serialize(userRecord);
    await this.cacheService.set(key, user);
    return user;
  }

  async listUsers(currentUserId) {
    const rows = await this.userRepository.list(currentUserId);
    return this.serializeCollection(rows);
  }

  async updateProfile(userId, updates) {
    const user = await this.updateRecord(userId, {
      username: updates.username,
    });

    await this.cacheService.set(this.cacheService.userProfileKey(userId), user);
    return user;
  }

  async updateAvatar(userId, avatarPath) {
    const existingUser = await this.getByIdOrFail(userId);

    if (existingUser.avatar_url?.startsWith("/uploads/")) {
      const existingPath = path.join(
        uploadsRoot,
        existingUser.avatar_url.replace("/uploads/", ""),
      );

      await fs.unlink(existingPath).catch(() => {});
    }

    const user = await this.updateRecord(userId, {
      avatar_url: avatarPath,
    });

    await this.cacheService.set(this.cacheService.userProfileKey(userId), user);
    return user;
  }

  async updateStatus(userId, status) {
    const updated = await this.userRepository.updateStatus(userId, status);
    const user = this.serialize(updated);
    await this.cacheService.set(this.cacheService.userProfileKey(userId), user);
    await this.invalidatePresenceCaches(userId);
    return user;
  }

  async invalidatePresenceCaches(userId) {
    if (!this.conversationMemberRepository) {
      return;
    }

    const conversationIds =
      await this.conversationMemberRepository.listActiveConversationIdsForUser(
        userId,
      );
    const visibleMemberIds = new Set();

    for (const conversationId of conversationIds) {
      const memberIds =
        await this.conversationMemberRepository.listActiveMemberIds(
          conversationId,
        );
      memberIds.forEach((memberId) => visibleMemberIds.add(memberId));
    }

    await Promise.all(
      [...visibleMemberIds].map((memberId) =>
        this.cacheService.del(this.cacheService.userConversationsKey(memberId)),
      ),
    );
  }

  async registerDeviceToken(userId, { token, platform, deviceId = null }) {
    if (!token || !platform) {
      throw new ValidationException("Device token and platform are required.");
    }

    return this.deviceTokenRepository.upsert({
      userId,
      token,
      platform,
      deviceId,
    });
  }
}

module.exports = UserService;
