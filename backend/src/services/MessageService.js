const fs = require("fs/promises");
const path = require("path");
const BaseService = require("./base/BaseService");
const Message = require("../models/entities/Message");
const { MESSAGE_CACHE } = require("../config/constants");
const ValidationException = require("../exceptions/ValidationException");

const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

const buildClientMessageId = (senderId) =>
  `${senderId}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

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
    await this.getConversationMembershipForUserOrFail(userId, conversationId);

    return this.conversationRepository.findById(conversationId);
  }

  async getConversationMembershipForUserOrFail(userId, conversationId) {
    const membership =
      await this.conversationMemberRepository.findByConversationAndUser(
        conversationId,
        userId,
      );
    if (!membership || membership.left_at || membership.is_deleted) {
      throw new ValidationException("Conversation not found.");
    }

    return membership;
  }

  async getOwnedMessageOrFail(userId, messageId, message) {
    const messageRow = await this.getByIdOrFail(messageId);

    if (messageRow.sender_id !== userId) {
      throw new ValidationException(message);
    }

    return messageRow;
  }

  formatSerializedMessage(row, receiptRows = [], attachmentRows = []) {
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

  async serializeMessage(row) {
    if (row.is_archived) {
      const receiptRows = parseJsonArray(row.receipts_json);
      const attachmentRows = parseJsonArray(row.attachments_json);

      return this.formatSerializedMessage(row, receiptRows, attachmentRows);
    }

    const [receiptRows, attachmentRows] = await Promise.all([
      this.messageReceiptRepository.listByMessageId(row.message_id),
      this.attachmentRepository.listByMessageId(row.message_id),
    ]);

    return this.formatSerializedMessage(row, receiptRows, attachmentRows);
  }

  groupRowsByMessageId(rows = []) {
    return rows.reduce((grouped, row) => {
      const messageRows = grouped.get(row.message_id) || [];
      messageRows.push(row);
      grouped.set(row.message_id, messageRows);
      return grouped;
    }, new Map());
  }

  async serializeMessages(rows = []) {
    const hotRows = rows.filter((row) => !row.is_archived);
    const hotMessageIds = hotRows.map((row) => row.message_id);
    const [receiptRows, attachmentRows] = await Promise.all([
      this.messageReceiptRepository.listByMessageIds(hotMessageIds),
      this.attachmentRepository.listByMessageIds(hotMessageIds),
    ]);
    const receiptsByMessageId = this.groupRowsByMessageId(receiptRows);
    const attachmentsByMessageId = this.groupRowsByMessageId(attachmentRows);

    return rows.map((row) => {
      if (row.is_archived) {
        return this.formatSerializedMessage(
          row,
          parseJsonArray(row.receipts_json),
          parseJsonArray(row.attachments_json),
        );
      }

      return this.formatSerializedMessage(
        row,
        receiptsByMessageId.get(row.message_id) || [],
        attachmentsByMessageId.get(row.message_id) || [],
      );
    });
  }

  async listMessages(userId, conversationId, options = {}) {
    await this.getConversationForUserOrFail(userId, conversationId);
    const limit = Number(options.limit || MESSAGE_CACHE.RECENT_LIMIT);
    const shouldCacheRecentMessages =
      !options.beforeMessageId && limit === MESSAGE_CACHE.RECENT_LIMIT;
    const cacheKey = shouldCacheRecentMessages
      ? this.cacheService.recentConversationMessagesKey(conversationId, limit)
      : null;

    if (cacheKey) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        this.logger?.info?.(`[CACHE HIT] ${cacheKey}`, {
          conversationId,
          limit,
        });
        return cached;
      }

      this.logger?.info?.(`[CACHE MISS] ${cacheKey}`, {
        conversationId,
        limit,
      });
    }

    const rows = await this.messageRepository.listByConversationWithArchive(
      conversationId,
      {
        limit,
        beforeMessageId: options.beforeMessageId,
      },
    );
    const nextCursor = rows.length ? rows[rows.length - 1].message_id : null;
    const orderedRows = [...rows].reverse();
    const messages = await this.serializeMessages(orderedRows);

    const result = {
      messages,
      nextCursor,
      hasMore: rows.length === limit,
    };

    if (cacheKey) {
      await this.cacheService.set(
        cacheKey,
        result,
        MESSAGE_CACHE.RECENT_TTL_SECONDS,
      );
      this.logger?.info?.(`[CACHE SET] ${cacheKey}`, {
        conversationId,
        limit,
        ttlSeconds: MESSAGE_CACHE.RECENT_TTL_SECONDS,
      });
    }

    return result;
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
    const result = await this.messageReceiptRepository.markDeliveredForUser(
      conversationId,
      userId,
    );

    if (result.affectedRows > 0) {
      await this.cacheService.del(
        this.cacheService.recentConversationMessagesKey(
          conversationId,
          MESSAGE_CACHE.RECENT_LIMIT,
        ),
      );
    }

    return { conversationId, userId };
  }

  async markConversationRead(userId, conversationId) {
    const membership = await this.getConversationMembershipForUserOrFail(
      userId,
      conversationId,
    );
    const latestMessage =
      await this.messageRepository.findLatestByConversation(conversationId);
    const latestMessageId = latestMessage?.message_id || null;
    const lastReadMessageId = membership.last_read_message_id || null;

    if (
      !latestMessageId ||
      Number(lastReadMessageId || 0) >= Number(latestMessageId)
    ) {
      return {
        conversationId,
        userId,
        lastReadMessageId: latestMessageId,
        unchanged: true,
      };
    }

    await this.messageReceiptRepository.markReadForUser(conversationId, userId);
    await this.conversationMemberRepository.markRead(
      conversationId,
      userId,
      latestMessageId,
    );

    await this.cacheService.del(this.cacheService.userConversationsKey(userId));
    await this.cacheService.del(
      this.cacheService.recentConversationMessagesKey(
        conversationId,
        MESSAGE_CACHE.RECENT_LIMIT,
      ),
    );

    const memberIds =
      await this.conversationMemberRepository.listActiveMemberIds(
        conversationId,
      );
    const payload = {
      conversationId,
      userId,
      lastReadMessageId: latestMessageId,
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
      this.cacheService.recentConversationMessagesKey(
        conversationId,
        MESSAGE_CACHE.RECENT_LIMIT,
      ),
    );

    for (const memberId of memberIds) {
      await this.cacheService.del(
        this.cacheService.userConversationsKey(memberId),
      );
    }
  }
}

module.exports = MessageService;
