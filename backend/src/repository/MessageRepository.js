const BaseRepository = require("./base/BaseRepository");

class MessageRepository extends BaseRepository {
  constructor(database) {
    super(database, "messages", "message_id");
  }

  async findByClientMessageId(senderId, clientMessageId, connection = null) {
    return this.findOneBy(
      {
        sender_id: senderId,
        client_message_id: clientMessageId,
      },
      connection,
      { orderBy: "message_id DESC" },
    );
  }

  async listByConversation(
    conversationId,
    { limit = 30, beforeMessageId = null } = {},
  ) {
    const cursorClause = beforeMessageId ? "AND message_id < ?" : "";
    const params = beforeMessageId
      ? [conversationId, Number(beforeMessageId), Number(limit)]
      : [conversationId, Number(limit)];

    return this.db.query(
      `
        SELECT *
        FROM messages
        WHERE conversation_id = ?
          ${cursorClause}
        ORDER BY message_id DESC
        LIMIT ?
      `,
      params,
    );
  }

  async searchForUser(userId, query) {
    return this.db.query(
      `
        SELECT m.*
        FROM messages m
        JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
        WHERE cm.user_id = ?
          AND cm.left_at IS NULL
          AND cm.is_deleted = FALSE
          AND m.content LIKE ?
        ORDER BY m.created_at DESC
        LIMIT 50
      `,
      [userId, `%${query}%`],
    );
  }

  async findLatestByConversation(conversationId, connection = null) {
    const rows = await this.db.query(
      `
        SELECT *
        FROM messages
        WHERE conversation_id = ?
        ORDER BY message_id DESC
        LIMIT 1
      `,
      [conversationId],
      connection,
    );
    return rows[0] || null;
  }

  async updateDeliveryState(messageId, deliveryState, connection = null) {
    return this.update(
      messageId,
      {
        delivery_state: deliveryState,
      },
      connection,
    );
  }
}

module.exports = MessageRepository;
