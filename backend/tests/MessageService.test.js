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
      markReadForUser: async () => undefined,
      markDeliveredForUser: async () => undefined,
      ...overrides.messageReceiptRepository,
    },
    attachmentRepository: {
      create: async () => undefined,
      listByMessageIds: async () => [],
      ...overrides.attachmentRepository,
    },
    cacheService: {
      del: async () => undefined,
      conversationMessagesKey: (id) => `conversation:${id}`,
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
