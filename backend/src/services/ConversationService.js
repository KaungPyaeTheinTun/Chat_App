const BaseService = require("./base/BaseService");

class ConversationService extends BaseService {
  constructor({ conversationRepository, cacheService, logger }) {
    super({
      repository: conversationRepository,
      cacheService,
      logger,
      notFoundMessage: "Conversation not found.",
    });
    this.conversationRepository = conversationRepository;
  }

  serializeConversationRow(row) {
    return {
      conversationId: row.conversation_id,
      participant1Id: row.participant_1_id,
      participant2Id: row.participant_2_id,
      lastMessageId: row.last_message_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      unreadCount: Number(row.unread_count || 0),
      lastMessage: row.last_message_id
        ? {
            messageId: row.last_message_id,
            content: row.last_message_content,
            messageType: row.last_message_type,
            senderId: row.last_message_sender_id,
            receiverId: row.last_message_receiver_id,
            isRead: Boolean(row.last_message_is_read),
            createdAt: row.last_message_created_at,
          }
        : null,
      otherUser: {
        userId: row.other_user_id,
        username: row.other_username,
        email: row.other_user_email,
        avatarUrl: row.other_user_avatar_url,
        status: row.other_user_status,
      },
    };
  }

  async listForUser(userId) {
    const key = this.cacheService.userConversationsKey(userId);
    const cached = await this.cacheService.get(key);
    if (cached) {
      return cached;
    }

    const rows = await this.conversationRepository.listForUser(userId);
    const conversations = rows.map((row) => this.serializeConversationRow(row));
    await this.cacheService.set(key, conversations);
    return conversations;
  }

  async getById(conversationId) {
    return this.getByIdOrFail(conversationId);
  }
}

module.exports = ConversationService;
