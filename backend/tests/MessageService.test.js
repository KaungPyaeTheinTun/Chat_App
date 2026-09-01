const test = require("node:test");
const assert = require("node:assert/strict");

const MessageService = require("../src/services/MessageService");
const ValidationException = require("../src/exceptions/ValidationException");

const createService = (overrides = {}) => {
  const emitted = [];

  const service = new MessageService({
    database: {
      withTransaction: async (callback) => callback({}),
    },
    messageRepository: {
      create: async (payload) => ({
        message_id: 77,
        conversation_id: 11,
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id,
        content: payload.content,
        message_type: payload.message_type,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      findById: async () => null,
      findLatestByConversation: async () => null,
      markConversationRead: async () => undefined,
      ...overrides.messageRepository,
    },
    conversationRepository: {
      getOrCreate: async () => ({
        conversation_id: 11,
      }),
      findById: async () => ({
        conversation_id: 11,
        participant_1_id: 1,
        participant_2_id: 2,
      }),
      updateLastMessage: async () => undefined,
      update: async () => undefined,
      ...overrides.conversationRepository,
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
    conversationRepository: {
      findById: async () => null,
    },
  });

  await assert.rejects(
    () => service.markConversationRead(1, 999),
    ValidationException,
  );
});
