class MessageHandler {
  constructor({ roomManager, messageService, cacheService }) {
    this.roomManager = roomManager;
    this.messageService = messageService;
    this.cacheService = cacheService;
  }

  register(socket) {
    socket.on("conversation:join", ({ conversationId }) => {
      if (conversationId) {
        this.roomManager.joinConversationRoom(socket, conversationId);
      }
    });

    socket.on("conversation:leave", ({ conversationId }) => {
      if (conversationId) {
        this.roomManager.leaveConversationRoom(socket, conversationId);
      }
    });

    socket.on("typing:start", async ({ conversationId }) => {
      if (conversationId) {
        await this.cacheService.set(
          `typing:${conversationId}:${socket.auth.userId}`,
          true,
          5,
        );
        socket
          .to(this.roomManager.conversationRoom(conversationId))
          .emit("typing:start", {
            conversationId,
            userId: socket.auth.userId,
          });
      }
    });

    socket.on("typing:stop", async ({ conversationId }) => {
      if (conversationId) {
        await this.cacheService.del(
          `typing:${conversationId}:${socket.auth.userId}`,
        );
        socket
          .to(this.roomManager.conversationRoom(conversationId))
          .emit("typing:stop", {
            conversationId,
            userId: socket.auth.userId,
          });
      }
    });

    socket.on("message:send", async (payload, callback) => {
      try {
        const result = await this.messageService.sendMessage({
          senderId: socket.auth.userId,
          receiverId: payload.receiverId ? Number(payload.receiverId) : null,
          conversationId: payload.conversationId
            ? Number(payload.conversationId)
            : null,
          content: payload.content,
          messageType: payload.messageType,
          clientMessageId: payload.clientMessageId,
        });
        callback?.({ success: true, data: result });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("message:delivered", async ({ conversationId }, callback) => {
      try {
        const result = await this.messageService.markConversationDelivered(
          socket.auth.userId,
          Number(conversationId),
        );
        callback?.({ success: true, data: result });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on("message:read", async ({ conversationId }, callback) => {
      try {
        const result = await this.messageService.markConversationRead(
          socket.auth.userId,
          Number(conversationId),
        );
        callback?.({ success: true, data: result });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });
  }
}

module.exports = MessageHandler;
