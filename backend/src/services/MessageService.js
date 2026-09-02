const fs = require("fs/promises");
const path = require("path");
const BaseService = require("./base/BaseService");
const Message = require("../models/entities/Message");
const ValidationException = require("../exceptions/ValidationException");

const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

const buildClientMessageId = (senderId) =>
  `${senderId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

class MessageService extends BaseService {
  constructor({
    database,
    messageRepository,
    conversationRepository,
    conversationMemberRepository,
    messageReceiptRepository,
    attachmentRepository,
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
    this.conversationMemberRepository = conversationMemberRepository;
    this.messageReceiptRepository = messageReceiptRepository;
    this.attachmentRepository = attachmentRepository;
    this.socketGateway = socketGateway;
  }

  async getConversationForUserOrFail(userId, conversationId) {
    const membership =
      await this.conversationMemberRepository.findByConversationAndUser(
        conversationId,
        userId,
      );

    if (!membership || membership.left_at || membership.is_deleted) {
      throw new ValidationException("Conversation not found.");
    }

    return this.conversationRepository.findById(conversationId);
  }

  async getOwnedMessageOrFail(userId, messageId, message) {
    const messageRow = await this.getByIdOrFail(messageId);

    if (messageRow.sender_id !== userId) {
      throw new ValidationException(message);
    }

    return messageRow;
  }

  async serializeMessage(row) {
    const [receiptRows, attachmentRows] = await Promise.all([
      this.database.query(
        `
          SELECT user_id, delivered_at, read_at
          FROM message_receipts
          WHERE message_id = ?
        `,
        [row.message_id],
      ),
      this.attachmentRepository.listByMessageIds([row.message_id]),
    ]);

    return {
      ...this.serialize(row),
      isRead:
        row.delivery_state === "read" ||
        receiptRows.some((receipt) => Boolean(receipt.read_at)),
      receipts: receiptRows.map((receipt) => ({
        userId: receipt.user_id,
        deliveredAt: receipt.delivered_at,
        readAt: receipt.read_at,
      })),
      attachments: attachmentRows.map((attachment) => ({
        attachmentId: attachment.attachment_id,
        fileUrl: attachment.file_url,
        thumbnailUrl: attachment.thumbnail_url,
        mimeType: attachment.mime_type,
        fileSize: attachment.file_size,
        originalName: attachment.original_name,
      })),
    };
  }

  async listMessages(userId, conversationId, options = {}) {
    await this.getConversationForUserOrFail(userId, conversationId);

    const rows = await this.messageRepository.listByConversation(
      conversationId,
      {
        limit: options.limit,
        beforeMessageId: options.beforeMessageId,
      },
    );
    const orderedRows = rows.reverse();
    const messages = await Promise.all(
      orderedRows.map((row) => this.serializeMessage(row)),
    );

    return {
      messages,
      nextCursor: rows.length ? rows[rows.length - 1].message_id : null,
      hasMore: rows.length === Number(options.limit || 30),
    };
  }

  async getTargetConversation({
    senderId,
    conversationId = null,
    receiverId = null,
    connection = null,
  }) {
    if (conversationId) {
      return this.getConversationForUserOrFail(senderId, conversationId);
    }

    if (!receiverId || senderId === receiverId) {
      throw new ValidationException("A different receiver is required.");
    }

    return this.conversationRepository.getOrCreate(
      senderId,
      receiverId,
      this.conversationMemberRepository,
      connection,
    );
  }

  async sendMessage({
    senderId,
    receiverId = null,
    conversationId = null,
    content,
    messageType = "text",
    clientMessageId = null,
    attachment = null,
  }) {
    const stableClientMessageId =
      clientMessageId || buildClientMessageId(senderId);
    const existing = await this.messageRepository.findByClientMessageId(
      senderId,
      stableClientMessageId,
    );

    if (existing) {
      return {
        conversationId: existing.conversation_id,
        message: await this.serializeMessage(existing),
        duplicate: true,
      };
    }

    const messageEntity = new Message({
      senderId,
      receiverId,
      content,
      messageType,
      clientMessageId: stableClientMessageId,
    });
    messageEntity.validate();

    return this.database.withTransaction(async (connection) => {
      const conversation = await this.getTargetConversation({
        senderId,
        conversationId,
        receiverId,
        connection,
      });

      const memberIds =
        await this.conversationMemberRepository.listActiveMemberIds(
          conversation.conversation_id,
          connection,
        );
      const recipientIds = memberIds.filter(
        (memberId) => memberId !== senderId,
      );

      const messageRow = await this.createRecord(
        {
          client_message_id: stableClientMessageId,
          conversation_id: conversation.conversation_id,
          sender_id: senderId,
          receiver_id:
            conversation.conversation_type === "direct"
              ? Number(receiverId)
              : null,
          content: String(content).trim(),
          message_type: messageType,
          delivery_state: "sent",
        },
        connection,
      );

      if (attachment) {
        await this.attachmentRepository.create(
          {
            message_id: messageRow.messageId,
            file_url: attachment.fileUrl,
            thumbnail_url: attachment.thumbnailUrl,
            mime_type: attachment.mimeType,
            file_size: attachment.fileSize,
            original_name: attachment.originalName,
          },
          connection,
        );
      }

      await this.messageReceiptRepository.createForRecipients(
        messageRow.messageId,
        conversation.conversation_id,
        recipientIds,
        connection,
      );
      await this.conversationRepository.updateLastMessage(
        conversation.conversation_id,
        messageRow.messageId,
        connection,
      );

      await this.invalidateConversationCaches(
        conversation.conversation_id,
        memberIds,
      );

      const persistedRow = await this.messageRepository.findById(
        messageRow.messageId,
        connection,
      );
      const payload = {
        conversationId: conversation.conversation_id,
        message: await this.serializeMessage(persistedRow),
      };

      this.socketGateway.emitToUsers(memberIds, "message:received", payload);
      this.socketGateway.emitToConversation(
        conversation.conversation_id,
        "message:received",
        payload,
      );

      return payload;
    });
  }

  async sendUploadedImageMessage({
    senderId,
    receiverId,
    conversationId,
    imagePath,
    file = null,
    clientMessageId = null,
  }) {
    return this.sendMessage({
      senderId,
      receiverId,
      conversationId,
      clientMessageId,
      content: imagePath,
      messageType: "image",
      attachment: {
        fileUrl: imagePath,
        mimeType: file?.mimetype,
        fileSize: file?.size,
        originalName: file?.originalname,
      },
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

    const memberIds =
      await this.conversationMemberRepository.listActiveMemberIds(
        messageRow.conversation_id,
      );
    await this.invalidateConversationCaches(
      messageRow.conversation_id,
      memberIds,
    );

    const payload = {
      conversationId: messageRow.conversation_id,
      message: await this.serializeMessage({
        ...messageRow,
        content: message.content,
        updated_at: message.updatedAt,
      }),
    };

    this.socketGateway.emitToUsers(memberIds, "message:updated", payload);
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

    const memberIds =
      await this.conversationMemberRepository.listActiveMemberIds(
        messageRow.conversation_id,
      );
    await this.invalidateConversationCaches(
      messageRow.conversation_id,
      memberIds,
    );

    const payload = {
      conversationId: messageRow.conversation_id,
      messageId,
    };

    this.socketGateway.emitToUsers(memberIds, "message:deleted", payload);
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
    return Promise.all(rows.map((row) => this.serializeMessage(row)));
  }

  async markConversationDelivered(userId, conversationId) {
    await this.getConversationForUserOrFail(userId, conversationId);
    await this.messageReceiptRepository.markDeliveredForUser(
      conversationId,
      userId,
    );
    return { conversationId, userId };
  }

  async markConversationRead(userId, conversationId) {
    await this.getConversationForUserOrFail(userId, conversationId);
    const latestMessage =
      await this.messageRepository.findLatestByConversation(conversationId);
    await this.messageReceiptRepository.markReadForUser(conversationId, userId);
    await this.conversationMemberRepository.markRead(
      conversationId,
      userId,
      latestMessage?.message_id || null,
    );

    await this.cacheService.del(this.cacheService.userConversationsKey(userId));

    const memberIds =
      await this.conversationMemberRepository.listActiveMemberIds(
        conversationId,
      );
    const payload = {
      conversationId,
      userId,
      lastReadMessageId: latestMessage?.message_id || null,
    };

    this.socketGateway.emitToUsers(memberIds, "message:read", payload);
    this.socketGateway.emitToConversation(
      conversationId,
      "message:read",
      payload,
    );

    return payload;
  }

  async invalidateConversationCaches(conversationId, memberIds) {
    await this.cacheService.del(
      this.cacheService.conversationMessagesKey(conversationId),
    );

    for (const memberId of memberIds) {
      await this.cacheService.del(
        this.cacheService.userConversationsKey(memberId),
      );
    }
  }
}

module.exports = MessageService;
