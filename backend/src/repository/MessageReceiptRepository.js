const BaseRepository = require("./base/BaseRepository");

class MessageReceiptRepository extends BaseRepository {
  constructor(database) {
    super(database, "message_receipts", "message_receipt_id");
  }

  async createForRecipients(
    messageId,
    conversationId,
    recipientIds,
    connection = null,
  ) {
    for (const userId of recipientIds) {
      await this.db.execute(
        `
          INSERT IGNORE INTO message_receipts
            (message_id, conversation_id, user_id)
          VALUES (?, ?, ?)
        `,
        [messageId, conversationId, userId],
        connection,
      );
    }
  }

  async markDeliveredForUser(conversationId, userId) {
    return this.db.execute(
      `
        UPDATE message_receipts
        SET delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND user_id = ? AND delivered_at IS NULL
      `,
      [conversationId, userId],
    );
  }

  async markReadForUser(conversationId, userId) {
    return this.db.execute(
      `
        UPDATE message_receipts
        SET delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
            read_at = COALESCE(read_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
        WHERE conversation_id = ? AND user_id = ? AND read_at IS NULL
      `,
      [conversationId, userId],
    );
  }

  async listByMessageId(messageId, connection = null) {
    return this.listByMessageIds([messageId], connection);
  }

  async listByMessageIds(messageIds = [], connection = null) {
    if (!messageIds.length) {
      return [];
    }

    const placeholders = messageIds.map(() => "?").join(", ");
    return this.db.query(
      `
        SELECT user_id, message_id, delivered_at, read_at
        FROM message_receipts
        WHERE message_id IN (${placeholders})
        ORDER BY message_receipt_id ASC
      `,
      messageIds,
      connection,
    );
  }

  async countUnreadForUser(conversationId, userId) {
    const rows = await this.db.query(
      `
        SELECT COUNT(*) AS unread_count
        FROM message_receipts
        WHERE conversation_id = ? AND user_id = ? AND read_at IS NULL
      `,
      [conversationId, userId],
    );
    return Number(rows[0]?.unread_count || 0);
  }
}

module.exports = MessageReceiptRepository;
