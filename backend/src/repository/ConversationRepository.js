const BaseRepository = require("./base/BaseRepository");

class ConversationRepository extends BaseRepository {
  constructor(database) {
    super(database, "conversations", "conversation_id");
  }

  normalizeParticipants(userA, userB) {
    return [Math.min(userA, userB), Math.max(userA, userB)];
  }

  async findByParticipants(userA, userB, connection = null) {
    const [participant1, participant2] = this.normalizeParticipants(
      userA,
      userB,
    );
    const rows = await this.db.query(
      "SELECT * FROM conversations WHERE participant_1_id = ? AND participant_2_id = ? LIMIT 1",
      [participant1, participant2],
      connection,
    );
    return rows[0] || null;
  }

  async getOrCreate(userA, userB, connection = null) {
    const existing = await this.findByParticipants(userA, userB, connection);
    if (existing) {
      return existing;
    }

    const [participant1, participant2] = this.normalizeParticipants(
      userA,
      userB,
    );
    return this.create(
      {
        participant_1_id: participant1,
        participant_2_id: participant2,
      },
      connection,
    );
  }

  async updateLastMessage(conversationId, messageId, connection = null) {
    return this.update(
      conversationId,
      {
        last_message_id: messageId,
      },
      connection,
    );
  }

  async listForUser(userId, limit = 50, offset = 0) {
    return this.db.query(
      `
        SELECT
          c.conversation_id,
          c.participant_1_id,
          c.participant_2_id,
          c.last_message_id,
          c.created_at,
          c.updated_at,
          m.content AS last_message_content,
          m.message_type AS last_message_type,
          m.sender_id AS last_message_sender_id,
          m.receiver_id AS last_message_receiver_id,
          m.is_read AS last_message_is_read,
          m.created_at AS last_message_created_at,
          COALESCE(unread.unread_count, 0) AS unread_count,
          u.user_id AS other_user_id,
          u.username AS other_username,
          u.email AS other_user_email,
          u.avatar_url AS other_user_avatar_url,
          u.status AS other_user_status
        FROM conversations c
        LEFT JOIN messages m ON m.message_id = c.last_message_id
        LEFT JOIN (
          SELECT conversation_id, COUNT(*) AS unread_count
          FROM messages
          WHERE receiver_id = ? AND is_read = FALSE
          GROUP BY conversation_id
        ) unread ON unread.conversation_id = c.conversation_id
        JOIN users u
          ON u.user_id = CASE
            WHEN c.participant_1_id = ? THEN c.participant_2_id
            ELSE c.participant_1_id
          END
        WHERE c.participant_1_id = ? OR c.participant_2_id = ?
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `,
      [userId, userId, userId, userId, Number(limit), Number(offset)],
    );
  }
}

module.exports = ConversationRepository;
