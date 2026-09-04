const test = require("node:test");
const assert = require("node:assert/strict");

const MessageService = require("../src/services/MessageService");
const ValidationException = require("../src/exceptions/ValidationException");

const createService = (overrides = {}) => {
  const emitted = [];

  const service = new MessageService({
    database: {
      withTransaction: async (callback) => callback({}),
      query: async () => [],
    },
    messageRepository: {
      findByClientMessageId: async () => null,
      create: async (payload) => ({
        message_id: 77,
        client_message_id: payload.client_message_id,
        conversation_id: 11,
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id,
        content: payload.content,
        message_type: payload.message_type,
        delivery_state: payload.delivery_state,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      findById: async (messageId) => ({
        message_id: messageId,
        client_message_id: "client-1",
        conversation_id: 11,
        sender_id: 1,
        receiver_id: 2,
        content: "hello",
        message_type: "text",
        delivery_state: "sent",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      findLatestByConversation: async () => null,
      listByConversationWithArchive: async () => [],
      ...overrides.messageRepository,
    },
    conversationRepository: {
      getOrCreate: async () => ({
        conversation_id: 11,
        conversation_type: "direct",
      }),
      findById: async () => ({
        conversation_id: 11,
        conversation_type: "direct",
      }),
      updateLastMessage: async () => undefined,
      update: async () => undefined,
      ...overrides.conversationRepository,
    },
    conversationMemberRepository: {
      findByConversationAndUser: async () => ({
        conversation_id: 11,
        user_id: 1,
        left_at: null,
        is_deleted: false,
      }),
      listActiveMemberIds: async () => [1, 2],
      markRead: async () => undefined,
      ...overrides.conversationMemberRepository,
    },
    messageReceiptRepository: {
      createForRecipients: async () => undefined,
      markReadForUser: async () => ({ affectedRows: 1 }),
      markDeliveredForUser: async () => ({ affectedRows: 1 }),
      listByMessageId: async () => [],
      listByMessageIds: async () => [],
      ...overrides.messageReceiptRepository,
    },
    attachmentRepository: {
      create: async () => undefined,
      listByMessageId: async () => [],
      listByMessageIds: async () => [],
      ...overrides.attachmentRepository,
    },
    cacheService: {
      get: async () => null,
      set: async () => undefined,
      del: async () => undefined,
      conversationMessagesKey: (id) => `conversation:${id}`,
      recentConversationMessagesKey: (id, limit) =>
        `conversation:${id}:recent:${limit}`,
      userConversationsKey: (id) => `user:${id}:conversations`,
    },
    socketGateway: {
      emitToUsers: (...args) => emitted.push(["users", ...args]),
      emitToConversation: (...args) => emitted.push(["conversation", ...args]),
    },
    logger: {},
  });

  return { service, emitted };
};

test("sendMessage rejects self messaging", async () => {
  const { service } = createService();

  await assert.rejects(
    () =>
      service.sendMessage({
        senderId: 1,
        receiverId: 1,
        content: "hello",
      }),
    ValidationException,
  );
});

test("sendMessage returns payload and emits enterprise events", async () => {
  const { service, emitted } = createService();
  const result = await service.sendMessage({
    senderId: 1,
    receiverId: 2,
    content: "hello",
  });

  assert.equal(result.conversationId, 11);
  assert.equal(result.message.content, "hello");
  assert.equal(emitted.length, 2);
  assert.equal(emitted[0][2], "message:received");
});

test("markConversationRead rejects missing conversations", async () => {
  const { service } = createService({
    conversationMemberRepository: {
      findByConversationAndUser: async () => null,
    },
  });

  await assert.rejects(
    () => service.markConversationRead(1, 999),
    ValidationException,
  );
});

test("markConversationRead skips unchanged latest message", async () => {
  let readUpdates = 0;
  let cacheDeletes = 0;
  const { service, emitted } = createService({
    messageRepository: {
      findLatestByConversation: async () => ({
        message_id: 77,
        conversation_id: 11,
      }),
    },
    conversationMemberRepository: {
      findByConversationAndUser: async () => ({
        conversation_id: 11,
        user_id: 1,
        last_read_message_id: 77,
        left_at: null,
        is_deleted: false,
      }),
      markRead: async () => {
        readUpdates += 1;
      },
    },
    cacheService: {
      get: async () => null,
      set: async () => undefined,
      del: async () => {
        cacheDeletes += 1;
      },
      conversationMessagesKey: (id) => `conversation:${id}`,
      recentConversationMessagesKey: (id, limit) =>
        `conversation:${id}:recent:${limit}`,
      userConversationsKey: (id) => `user:${id}:conversations`,
    },
  });

  const result = await service.markConversationRead(1, 11);

  assert.equal(result.unchanged, true);
  assert.equal(readUpdates, 0);
  assert.equal(cacheDeletes, 0);
  assert.equal(emitted.length, 0);
});

test("listMessages can serialize archived messages", async () => {
  const { service } = createService({
    messageRepository: {
      listByConversationWithArchive: async () => [
        {
          message_id: 12,
          client_message_id: "old-client-1",
          conversation_id: 11,
          sender_id: 2,
          receiver_id: 1,
          content: "old hello",
          message_type: "text",
          delivery_state: "read",
          created_at: "2026-01-01 00:00:00",
          updated_at: "2026-01-01 00:00:00",
          receipts_json: JSON.stringify([
            {
              user_id: 1,
              delivered_at: "2026-01-01 00:00:01",
              read_at: "2026-01-01 00:00:02",
            },
          ]),
          attachments_json: JSON.stringify([]),
          is_archived: 1,
        },
      ],
    },
  });

  const result = await service.listMessages(1, 11, {
    limit: 20,
    beforeMessageId: 20,
  });

  assert.equal(result.messages.length, 1);
  assert.equal(result.messages[0].content, "old hello");
  assert.equal(result.messages[0].isRead, true);
  assert.equal(result.messages[0].receipts[0].userId, 1);
  assert.equal(result.nextCursor, 12);
});

test("listMessages batch-loads hot message relations", async () => {
  let receiptBatchCalls = 0;
  let attachmentBatchCalls = 0;
  let singleReceiptCalls = 0;
  let singleAttachmentCalls = 0;
  const { service } = createService({
    messageRepository: {
      listByConversationWithArchive: async () => [
        {
          message_id: 13,
          client_message_id: "client-13",
          conversation_id: 11,
          sender_id: 2,
          receiver_id: 1,
          content: "second",
          message_type: "text",
          delivery_state: "sent",
          created_at: "2026-01-01 00:00:01",
          updated_at: "2026-01-01 00:00:01",
        },
        {
          message_id: 12,
          client_message_id: "client-12",
          conversation_id: 11,
          sender_id: 2,
          receiver_id: 1,
          content: "first",
          message_type: "text",
          delivery_state: "sent",
          created_at: "2026-01-01 00:00:00",
          updated_at: "2026-01-01 00:00:00",
        },
      ],
    },
    messageReceiptRepository: {
      listByMessageId: async () => {
        singleReceiptCalls += 1;
        return [];
      },
      listByMessageIds: async (messageIds) => {
        receiptBatchCalls += 1;
        assert.deepEqual(messageIds, [12, 13]);
        return [];
      },
    },
    attachmentRepository: {
      listByMessageId: async () => {
        singleAttachmentCalls += 1;
        return [];
      },
      listByMessageIds: async (messageIds) => {
        attachmentBatchCalls += 1;
        assert.deepEqual(messageIds, [12, 13]);
        return [];
      },
    },
  });

  const result = await service.listMessages(1, 11, {
    limit: 20,
    beforeMessageId: 14,
  });

  assert.equal(result.messages.length, 2);
  assert.equal(receiptBatchCalls, 1);
  assert.equal(attachmentBatchCalls, 1);
  assert.equal(singleReceiptCalls, 0);
  assert.equal(singleAttachmentCalls, 0);
});
