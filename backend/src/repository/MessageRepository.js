const BaseRepository = require("./base/BaseRepository");

class MessageRepository extends BaseRepository {
  constructor(database) {
    super(database, "messages", "message_id");
  }

  async listByConversation(conversationId, limit = 30, offset = 0) {
    return this.db.query(
      `
        SELECT * FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [conversationId, Number(limit), Number(offset)],
    );
  }

  async searchForUser(userId, query) {
    return this.db.query(
      `
        SELECT m.*
        FROM messages m
        JOIN conversations c ON c.conversation_id = m.conversation_id
        WHERE (c.participant_1_id = ? OR c.participant_2_id = ?)
          AND m.content LIKE ?
        ORDER BY m.created_at DESC
        LIMIT 50
      `,
      [userId, userId, `%${query}%`],
    );
  }

  async markConversationRead(conversationId, userId) {
    await this.db.execute(
      `
        UPDATE messages
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE
      `,
      [conversationId, userId],
    );
  }

  async findLatestByConversation(conversationId, connection = null) {
    const rows = await this.db.query(
      `
        SELECT * FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC, message_id DESC
        LIMIT 1
      `,
      [conversationId],
      connection,
    );
    return rows[0] || null;
  }
}

module.exports = MessageRepository;
