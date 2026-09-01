class MessageHandler {
  constructor({ roomManager, messageService }) {
    this.roomManager = roomManager;
    this.messageService = messageService;
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

    socket.on("typing:start", ({ conversationId }) => {
      if (conversationId) {
        socket
          .to(this.roomManager.conversationRoom(conversationId))
          .emit("typing:start", {
            conversationId,
            userId: socket.auth.userId,
          });
      }
    });

    socket.on("typing:stop", ({ conversationId }) => {
      if (conversationId) {
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
          receiverId: Number(payload.receiverId),
          content: payload.content,
          messageType: payload.messageType,
        });
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
