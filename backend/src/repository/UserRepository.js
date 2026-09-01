const BaseRepository = require("./base/BaseRepository");

class UserRepository extends BaseRepository {
  constructor(database) {
    super(database, "users", "user_id", {
      defaultOrderBy: "username ASC",
      defaultSelect:
        "user_id, username, email, password, avatar_url, status, created_at, updated_at",
    });
  }

  async findByEmail(email, connection = null) {
    return this.findOneBy({ email }, connection);
  }

  async findByUsername(username, connection = null) {
    return this.findOneBy({ username }, connection);
  }

  async list(excludeUserId, limit = 50, offset = 0) {
    return this.db.query(
      `
        SELECT user_id, username, email, avatar_url, status, created_at, updated_at
        FROM users
        WHERE user_id != ?
        ORDER BY username ASC
        LIMIT ? OFFSET ?
      `,
      [excludeUserId, Number(limit), Number(offset)],
    );
  }

  async updateStatus(userId, status) {
    await this.db.execute("UPDATE users SET status = ? WHERE user_id = ?", [
      status,
      userId,
    ]);
    return this.findById(userId);
  }
}

module.exports = UserRepository;
