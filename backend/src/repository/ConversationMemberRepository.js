const BaseRepository = require("./base/BaseRepository");

class ConversationMemberRepository extends BaseRepository {
  constructor(database) {
    super(database, "conversation_members", "conversation_member_id");
  }

  async addMember(
    conversationId,
    userId,
    { role = "member" } = {},
    connection = null,
  ) {
    await this.db.execute(
      `
        INSERT INTO conversation_members (conversation_id, user_id, role)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          left_at = NULL,
          is_deleted = FALSE,
          updated_at = CURRENT_TIMESTAMP
      `,
      [conversationId, userId, role],
      connection,
    );

    return this.findByConversationAndUser(conversationId, userId, connection);
  }

  async addMembers(conversationId, members, connection = null) {
    const uniqueMembers = Array.from(
      new Map(members.map((member) => [member.userId, member])).values(),
    );

    for (const member of uniqueMembers) {
      await this.addMember(conversationId, member.userId, member, connection);
    }
  }

  async findByConversationAndUser(conversationId, userId, connection = null) {
    return this.findOneBy(
      {
        conversation_id: conversationId,
        user_id: userId,
      },
      connection,
      { orderBy: "conversation_member_id ASC" },
    );
  }

  async listActiveMembers(conversationId, connection = null) {
    return this.db.query(
      `
        SELECT cm.*, u.username, u.email, u.avatar_url, u.status, u.last_seen_at
        FROM conversation_members cm
        JOIN users u ON u.user_id = cm.user_id
        WHERE cm.conversation_id = ?
          AND cm.left_at IS NULL
          AND cm.is_deleted = FALSE
        ORDER BY cm.joined_at ASC
      `,
      [conversationId],
      connection,
    );
  }

  async listActiveMemberIds(conversationId, connection = null) {
    const rows = await this.listActiveMembers(conversationId, connection);
    return rows.map((row) => row.user_id);
  }

  async listActiveConversationIdsForUser(userId, connection = null) {
    const rows = await this.db.query(
      `
        SELECT conversation_id
        FROM conversation_members
        WHERE user_id = ?
          AND left_at IS NULL
          AND is_deleted = FALSE
      `,
      [userId],
      connection,
    );
    return rows.map((row) => row.conversation_id);
  }

  async updatePreferences(conversationId, userId, preferences) {
    const allowed = ["is_archived", "is_muted", "is_pinned", "is_deleted"];
    const entries = Object.entries(preferences).filter(([key]) =>
      allowed.includes(key),
    );

    if (!entries.length) {
      return this.findByConversationAndUser(conversationId, userId);
    }

    const clause = entries.map(([key]) => `${key} = ?`).join(", ");
    await this.db.execute(
      `
        UPDATE conversation_members
        SET ${clause}, updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND user_id = ?
      `,
      [...entries.map(([, value]) => Boolean(value)), conversationId, userId],
    );

    return this.findByConversationAndUser(conversationId, userId);
  }

  async markLeft(conversationId, userId) {
    await this.db.execute(
      `
        UPDATE conversation_members
        SET left_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND user_id = ?
      `,
      [conversationId, userId],
    );
  }

  async markRead(conversationId, userId, messageId = null) {
    await this.db.execute(
      `
        UPDATE conversation_members
        SET
          last_read_message_id = ?,
          last_read_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND user_id = ?
      `,
      [messageId, conversationId, userId],
    );
  }
}

module.exports = ConversationMemberRepository;
