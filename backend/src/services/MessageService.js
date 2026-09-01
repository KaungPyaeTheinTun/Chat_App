const fs = require("fs/promises");
const path = require("path");
const BaseService = require("./base/BaseService");
const Message = require("../models/entities/Message");
const ValidationException = require("../exceptions/ValidationException");

const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

class MessageService extends BaseService {
  constructor({
    database,
    messageRepository,
    conversationRepository,
    cacheService,
    socketGateway,
    logger,
  }) {
    super({
      repository: messageRepository,
      entityClass: Message,
      cacheService,
      logger,
      notFoundMessage: "Message not found.",
    });
    this.database = database;
    this.messageRepository = messageRepository;
    this.conversationRepository = conversationRepository;
    this.socketGateway = socketGateway;
  }

  async getConversationForUserOrFail(userId, conversationId) {
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (
      !conversation ||
      (conversation.participant_1_id !== userId &&
        conversation.participant_2_id !== userId)
    ) {
      throw new ValidationException("Conversation not found.");
    }

    return conversation;
  }

  async getOwnedMessageOrFail(userId, messageId, message) {
    const messageRow = await this.getByIdOrFail(messageId);

    if (messageRow.sender_id !== userId) {
      throw new ValidationException(message);
    }

    return messageRow;
  }

  async listMessages(userId, conversationId, limit = 30, offset = 0) {
    await this.getConversationForUserOrFail(userId, conversationId);

    const key = this.cacheService.conversationMessagesKey(conversationId);
    if (Number(offset) === 0) {
      const cached = await this.cacheService.get(key);
      if (cached) {
        return cached;
      }
    }

    const rows = await this.messageRepository.listByConversation(
      conversationId,
      limit,
      offset,
    );
    const messages = this.serializeCollection(rows.reverse());

    if (Number(offset) === 0) {
      await this.cacheService.set(key, messages);
    }

    return messages;
  }

  async sendMessage({ senderId, receiverId, content, messageType = "text" }) {
    const messageEntity = new Message({
      senderId,
      receiverId,
      content,
      messageType,
    });
    messageEntity.validate();

    if (senderId === receiverId) {
      throw new ValidationException("You cannot send a message to yourself.");
    }

    return this.database.withTransaction(async (connection) => {
      const conversation = await this.conversationRepository.getOrCreate(
        senderId,
        receiverId,
        connection,
      );

      const message = await this.createRecord(
        {
          conversation_id: conversation.conversation_id,
          sender_id: senderId,
          receiver_id: receiverId,
          content: String(content).trim(),
          message_type: messageType,
        },
        connection,
      );

      await this.conversationRepository.updateLastMessage(
        conversation.conversation_id,
        message.messageId,
        connection,
      );

      await this.cacheService.del(
        this.cacheService.conversationMessagesKey(conversation.conversation_id),
      );
      await this.cacheService.del(
        this.cacheService.userConversationsKey(senderId),
      );
      await this.cacheService.del(
        this.cacheService.userConversationsKey(receiverId),
      );

      const payload = {
        conversationId: conversation.conversation_id,
        message,
      };

      this.socketGateway.emitToUsers(
        [senderId, receiverId],
        "message:received",
        payload,
      );
      this.socketGateway.emitToConversation(
        conversation.conversation_id,
        "message:received",
        payload,
      );

      return payload;
    });
  }

  async sendUploadedImageMessage({ senderId, receiverId, imagePath }) {
    return this.sendMessage({
      senderId,
      receiverId,
      content: imagePath,
      messageType: "image",
    });
  }

  async editMessage(userId, messageId, content) {
    if (!String(content || "").trim()) {
      throw new ValidationException("Message content cannot be empty.");
    }

    const messageRow = await this.getOwnedMessageOrFail(
      userId,
      messageId,
      "You can only edit your own messages.",
    );

    const message = await this.updateRecord(messageId, {
      content: String(content).trim(),
    });

    await this.cacheService.del(
      this.cacheService.conversationMessagesKey(messageRow.conversation_id),
    );
    const payload = {
      conversationId: messageRow.conversation_id,
      message,
    };

    this.socketGateway.emitToUsers(
      [messageRow.sender_id, messageRow.receiver_id],
      "message:updated",
      payload,
    );
    this.socketGateway.emitToConversation(
      messageRow.conversation_id,
      "message:updated",
      payload,
    );

    return payload;
  }

  async deleteMessage(userId, messageId) {
    const messageRow = await this.getOwnedMessageOrFail(
      userId,
      messageId,
      "You can only delete your own messages.",
    );

    await this.deleteRecord(messageId);

    if (
      messageRow.message_type === "image" &&
      messageRow.content?.startsWith("/uploads/messages/")
    ) {
      const filePath = path.join(
        uploadsRoot,
        messageRow.content.replace("/uploads/", ""),
      );
      await fs.unlink(filePath).catch(() => {});
    }

    const latestMessage = await this.messageRepository.findLatestByConversation(
      messageRow.conversation_id,
    );
    await this.conversationRepository.update(messageRow.conversation_id, {
      last_message_id: latestMessage?.message_id || null,
    });

    await this.cacheService.del(
      this.cacheService.conversationMessagesKey(messageRow.conversation_id),
    );
    await this.cacheService.del(
      this.cacheService.userConversationsKey(messageRow.sender_id),
    );
    await this.cacheService.del(
      this.cacheService.userConversationsKey(messageRow.receiver_id),
    );

    const payload = {
      conversationId: messageRow.conversation_id,
      messageId,
    };

    this.socketGateway.emitToUsers(
      [messageRow.sender_id, messageRow.receiver_id],
      "message:deleted",
      payload,
    );
    this.socketGateway.emitToConversation(
      messageRow.conversation_id,
      "message:deleted",
      payload,
    );

    return payload;
  }

  async searchMessages(userId, query) {
    if (!query?.trim()) {
      throw new ValidationException("Search query is required.");
    }

    const rows = await this.messageRepository.searchForUser(
      userId,
      query.trim(),
    );
    return this.serializeCollection(rows);
  }

  async markConversationRead(userId, conversationId) {
    const conversation = await this.getConversationForUserOrFail(
      userId,
      conversationId,
    );

    await this.messageRepository.markConversationRead(conversationId, userId);
    await this.cacheService.del(
      this.cacheService.conversationMessagesKey(conversationId),
    );

    const payload = {
      conversationId,
      userId,
    };

    this.socketGateway.emitToUsers(
      [conversation.participant_1_id, conversation.participant_2_id],
      "message:read",
      payload,
    );
    this.socketGateway.emitToConversation(
      conversationId,
      "message:read",
      payload,
    );

    return payload;
  }
}

module.exports = MessageService;
