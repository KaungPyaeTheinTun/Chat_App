const BaseRepository = require("./base/BaseRepository");

class DeviceTokenRepository extends BaseRepository {
  constructor(database) {
    super(database, "device_tokens", "device_token_id");
  }

  async upsert({ userId, token, platform, deviceId = null }) {
    await this.db.execute(
      `
        INSERT INTO device_tokens (user_id, token, platform, device_id)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          user_id = VALUES(user_id),
          platform = VALUES(platform),
          device_id = VALUES(device_id),
          is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP
      `,
      [userId, token, platform, deviceId],
    );

    return this.findOneBy({ token });
  }

  async listActiveForUsers(userIds = []) {
    if (!userIds.length) {
      return [];
    }

    const placeholders = userIds.map(() => "?").join(", ");
    return this.db.query(
      `
        SELECT *
        FROM device_tokens
        WHERE user_id IN (${placeholders}) AND is_active = TRUE
      `,
      userIds,
    );
  }

  async deactivate(token) {
    await this.db.execute(
      `
        UPDATE device_tokens
        SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
        WHERE token = ?
      `,
      [token],
    );
  }
}

module.exports = DeviceTokenRepository;
