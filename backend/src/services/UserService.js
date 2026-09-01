const fs = require("fs/promises");
const path = require("path");
const BaseService = require("./base/BaseService");
const User = require("../models/entities/User");

const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

class UserService extends BaseService {
  constructor({ userRepository, cacheService, logger }) {
    super({
      repository: userRepository,
      entityClass: User,
      cacheService,
      logger,
      notFoundMessage: "User not found.",
    });
    this.userRepository = userRepository;
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
    return user;
  }
}

module.exports = UserService;
