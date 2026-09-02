const BaseRepository = require("./base/BaseRepository");

class AttachmentRepository extends BaseRepository {
  constructor(database) {
    super(database, "attachments", "attachment_id");
  }

  async listByMessageIds(messageIds = [], connection = null) {
    if (!messageIds.length) {
      return [];
    }

    const placeholders = messageIds.map(() => "?").join(", ");
    return this.db.query(
      `
        SELECT *
        FROM attachments
        WHERE message_id IN (${placeholders})
        ORDER BY attachment_id ASC
      `,
      messageIds,
      connection,
    );
  }
}

module.exports = AttachmentRepository;
