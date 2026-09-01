const ValidationException = require("../../exceptions/ValidationException");

class User {
  constructor(data = {}) {
    this.userId = data.user_id || data.userId || null;
    this.username = data.username || null;
    this.email = data.email || null;
    this.password = data.password || null;
    this.avatarUrl = data.avatar_url || data.avatarUrl || null;
    this.status = data.status || "offline";
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  validateForCreate() {
    const errors = [];

    if (!this.username || this.username.trim().length < 3) {
      errors.push("Username must be at least 3 characters.");
    }

    if (!this.email) {
      errors.push("Email is required.");
    }

    if (!this.password || this.password.length < 6) {
      errors.push("Password must be at least 6 characters.");
    }

    if (errors.length) {
      throw new ValidationException("Invalid user payload.", errors);
    }
  }

  toPublicJSON() {
    return {
      userId: this.userId,
      username: this.username,
      email: this.email,
      avatarUrl: this.avatarUrl,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
