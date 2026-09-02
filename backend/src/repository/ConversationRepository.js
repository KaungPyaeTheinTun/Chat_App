const BaseRepository = require("./base/BaseRepository");

class ConversationRepository extends BaseRepository {
  constructor(database) {
    super(database, "conversations", "conversation_id");
  }

  async findDirectBetween(userA, userB, connection = null) {
    const rows = await this.db.query(
      `
        SELECT c.*
        FROM conversations c
        JOIN conversation_members cm1
          ON cm1.conversation_id = c.conversation_id
          AND cm1.user_id = ?
          AND cm1.left_at IS NULL
          AND cm1.is_deleted = FALSE
        JOIN conversation_members cm2
          ON cm2.conversation_id = c.conversation_id
          AND cm2.user_id = ?
          AND cm2.left_at IS NULL
          AND cm2.is_deleted = FALSE
        WHERE c.conversation_type = 'direct'
        LIMIT 1
      `,
      [userA, userB],
      connection,
    );
    return rows[0] || null;
  }

  async createDirect(userA, userB, memberRepository, connection = null) {
    const conversation = await this.create(
      {
        conversation_type: "direct",
        created_by: userA,
      },
      connection,
    );

    await memberRepository.addMembers(
      conversation.conversation_id,
      [
        { userId: userA, role: "owner" },
        { userId: userB, role: "member" },
      ],
      connection,
    );

    return conversation;
  }

  async getOrCreate(userA, userB, memberRepository, connection = null) {
    const existing = await this.findDirectBetween(userA, userB, connection);
    if (existing) {
      return existing;
    }

    return this.createDirect(userA, userB, memberRepository, connection);
  }

  async createGroup(
    { title, createdBy, memberIds },
    memberRepository,
    connection = null,
  ) {
    const conversation = await this.create(
      {
        conversation_type: "group",
        title,
        created_by: createdBy,
      },
      connection,
    );
    const members = Array.from(new Set([createdBy, ...memberIds])).map(
      (userId) => ({
        userId,
        role: userId === createdBy ? "owner" : "member",
      }),
    );

    await memberRepository.addMembers(
      conversation.conversation_id,
      members,
      connection,
    );
    return conversation;
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

  async listForUser(
    userId,
    { includeArchived = false, limit = 50, offset = 0 } = {},
  ) {
    const archivedClause = includeArchived ? "" : "AND cm.is_archived = FALSE";
    return this.db.query(
      `
        SELECT
          c.conversation_id,
          c.conversation_type,
          c.title,
          c.avatar_url,
          c.created_by,
          c.last_message_id,
          c.created_at,
          c.updated_at,
          cm.role AS member_role,
          cm.is_archived,
          cm.is_muted,
          cm.is_pinned,
          cm.last_read_message_id,
          cm.last_read_at,
          m.client_message_id AS last_message_client_message_id,
          m.content AS last_message_content,
          m.message_type AS last_message_type,
          m.sender_id AS last_message_sender_id,
          m.receiver_id AS last_message_receiver_id,
          m.delivery_state AS last_message_delivery_state,
          m.created_at AS last_message_created_at,
          COALESCE(unread.unread_count, 0) AS unread_count,
          (
            SELECT u.user_id
            FROM conversation_members om
            JOIN users u ON u.user_id = om.user_id
            WHERE om.conversation_id = c.conversation_id
              AND om.user_id <> ?
              AND om.left_at IS NULL
              AND om.is_deleted = FALSE
            ORDER BY om.joined_at ASC
            LIMIT 1
          ) AS other_user_id,
          (
            SELECT u.username
            FROM conversation_members om
            JOIN users u ON u.user_id = om.user_id
            WHERE om.conversation_id = c.conversation_id
              AND om.user_id <> ?
              AND om.left_at IS NULL
              AND om.is_deleted = FALSE
            ORDER BY om.joined_at ASC
            LIMIT 1
          ) AS other_username,
          (
            SELECT u.email
            FROM conversation_members om
            JOIN users u ON u.user_id = om.user_id
            WHERE om.conversation_id = c.conversation_id
              AND om.user_id <> ?
              AND om.left_at IS NULL
              AND om.is_deleted = FALSE
            ORDER BY om.joined_at ASC
            LIMIT 1
          ) AS other_user_email,
          (
            SELECT u.avatar_url
            FROM conversation_members om
            JOIN users u ON u.user_id = om.user_id
            WHERE om.conversation_id = c.conversation_id
              AND om.user_id <> ?
              AND om.left_at IS NULL
              AND om.is_deleted = FALSE
            ORDER BY om.joined_at ASC
            LIMIT 1
          ) AS other_user_avatar_url,
          (
            SELECT u.status
            FROM conversation_members om
            JOIN users u ON u.user_id = om.user_id
            WHERE om.conversation_id = c.conversation_id
              AND om.user_id <> ?
              AND om.left_at IS NULL
              AND om.is_deleted = FALSE
            ORDER BY om.joined_at ASC
            LIMIT 1
          ) AS other_user_status,
          (
            SELECT u.last_seen_at
            FROM conversation_members om
            JOIN users u ON u.user_id = om.user_id
            WHERE om.conversation_id = c.conversation_id
              AND om.user_id <> ?
              AND om.left_at IS NULL
              AND om.is_deleted = FALSE
            ORDER BY om.joined_at ASC
            LIMIT 1
          ) AS other_user_last_seen_at
        FROM conversation_members cm
        JOIN conversations c ON c.conversation_id = cm.conversation_id
        LEFT JOIN messages m ON m.message_id = c.last_message_id
        LEFT JOIN (
          SELECT conversation_id, COUNT(*) AS unread_count
          FROM message_receipts
          WHERE user_id = ? AND read_at IS NULL
          GROUP BY conversation_id
        ) unread ON unread.conversation_id = c.conversation_id
        WHERE cm.user_id = ?
          AND cm.left_at IS NULL
          AND cm.is_deleted = FALSE
          ${archivedClause}
        ORDER BY cm.is_pinned DESC, c.updated_at DESC
        LIMIT ? OFFSET ?
      `,
      [
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        Number(limit),
        Number(offset),
      ],
    );
  }
}

module.exports = ConversationRepository;
