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

  async ensureArchiveTable() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS messages_archive (
        message_id INT NOT NULL,
        client_message_id VARCHAR(80) NOT NULL,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        receiver_id INT NULL,
        content TEXT NOT NULL,
        message_type ENUM('text', 'image', 'audio', 'video', 'document') DEFAULT 'text',
        delivery_state ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
        created_at DATETIME NOT NULL,
        updated_at DATETIME NULL,
        receipts_json JSON NULL,
        attachments_json JSON NULL,
        archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (message_id, created_at),
        INDEX idx_messages_archive_conversation_cursor (conversation_id, message_id),
        INDEX idx_messages_archive_created_at (created_at)
      )
      PARTITION BY RANGE COLUMNS(created_at) (
        PARTITION p_before_2026 VALUES LESS THAN ('2026-01-01'),
        PARTITION p2026_01 VALUES LESS THAN ('2026-02-01'),
        PARTITION p2026_02 VALUES LESS THAN ('2026-03-01'),
        PARTITION p2026_03 VALUES LESS THAN ('2026-04-01'),
        PARTITION p2026_04 VALUES LESS THAN ('2026-05-01'),
        PARTITION p2026_05 VALUES LESS THAN ('2026-06-01'),
        PARTITION p2026_06 VALUES LESS THAN ('2026-07-01'),
        PARTITION p2026_07 VALUES LESS THAN ('2026-08-01'),
        PARTITION p2026_08 VALUES LESS THAN ('2026-09-01'),
        PARTITION p2026_09 VALUES LESS THAN ('2026-10-01'),
        PARTITION p2026_10 VALUES LESS THAN ('2026-11-01'),
        PARTITION p2026_11 VALUES LESS THAN ('2026-12-01'),
        PARTITION p2026_12 VALUES LESS THAN ('2027-01-01'),
        PARTITION p2027_01 VALUES LESS THAN ('2027-02-01'),
        PARTITION p2027_02 VALUES LESS THAN ('2027-03-01'),
        PARTITION p2027_03 VALUES LESS THAN ('2027-04-01'),
        PARTITION p2027_04 VALUES LESS THAN ('2027-05-01'),
        PARTITION p2027_05 VALUES LESS THAN ('2027-06-01'),
        PARTITION p2027_06 VALUES LESS THAN ('2027-07-01'),
        PARTITION p2027_07 VALUES LESS THAN ('2027-08-01'),
        PARTITION p2027_08 VALUES LESS THAN ('2027-09-01'),
        PARTITION p2027_09 VALUES LESS THAN ('2027-10-01'),
        PARTITION p2027_10 VALUES LESS THAN ('2027-11-01'),
        PARTITION p2027_11 VALUES LESS THAN ('2027-12-01'),
        PARTITION p2027_12 VALUES LESS THAN ('2028-01-01'),
        PARTITION p_future VALUES LESS THAN (MAXVALUE)
      )
    `);
  }

  async listArchiveByConversation(
    conversationId,
    { limit = 30, beforeMessageId = null } = {},
  ) {
    const cursorClause = beforeMessageId ? "AND message_id < ?" : "";
    const params = beforeMessageId
      ? [conversationId, Number(beforeMessageId), Number(limit)]
      : [conversationId, Number(limit)];

    return this.db.query(
      `
        SELECT
          message_id,
          client_message_id,
          conversation_id,
          sender_id,
          receiver_id,
          content,
          message_type,
          delivery_state,
          created_at,
          updated_at,
          receipts_json,
          attachments_json,
          TRUE AS is_archived
        FROM messages_archive
        WHERE conversation_id = ?
          ${cursorClause}
        ORDER BY message_id DESC
        LIMIT ?
      `,
      params,
    );
  }

  async listByConversationWithArchive(
    conversationId,
    { limit = 30, beforeMessageId = null } = {},
  ) {
    const hotRows = await this.listByConversation(conversationId, {
      limit,
      beforeMessageId,
    });

    if (!beforeMessageId || hotRows.length >= Number(limit)) {
      return hotRows;
    }

    const archiveLimit = Number(limit) - hotRows.length;
    const archiveCursor = hotRows.length
      ? hotRows[hotRows.length - 1].message_id
      : beforeMessageId;
    const archiveRows = await this.listArchiveByConversation(conversationId, {
      limit: archiveLimit,
      beforeMessageId: archiveCursor,
    });

    return [...hotRows, ...archiveRows];
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

  async listArchivableBefore(cutoffDate, limit = 500, connection = null) {
    return this.db.query(
      `
        SELECT m.*
        FROM messages m
        WHERE m.created_at < ?
          AND NOT EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.last_message_id = m.message_id
          )
          AND NOT EXISTS (
            SELECT 1
            FROM conversation_members cm
            WHERE cm.last_read_message_id = m.message_id
          )
        ORDER BY m.created_at ASC
        LIMIT ?
      `,
      [cutoffDate, Number(limit)],
      connection,
    );
  }

  async archiveMessage(
    message,
    { receipts = [], attachments = [] } = {},
    connection = null,
  ) {
    await this.db.execute(
      `
        INSERT INTO messages_archive (
          message_id,
          client_message_id,
          conversation_id,
          sender_id,
          receiver_id,
          content,
          message_type,
          delivery_state,
          created_at,
          updated_at,
          receipts_json,
          attachments_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          delivery_state = VALUES(delivery_state),
          updated_at = VALUES(updated_at),
          receipts_json = VALUES(receipts_json),
          attachments_json = VALUES(attachments_json),
          archived_at = CURRENT_TIMESTAMP
      `,
      [
        message.message_id,
        message.client_message_id,
        message.conversation_id,
        message.sender_id,
        message.receiver_id,
        message.content,
        message.message_type,
        message.delivery_state,
        message.created_at,
        message.updated_at,
        JSON.stringify(receipts),
        JSON.stringify(attachments),
      ],
      connection,
    );
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
