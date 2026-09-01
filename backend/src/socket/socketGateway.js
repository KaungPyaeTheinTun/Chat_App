class SocketGateway {
  setServer(io) {
    this.io = io;
  }

  emitToConversation(conversationId, event, payload) {
    this.io?.to(`conversation:${conversationId}`).emit(event, payload);
  }

  emitToUsers(userIds, event, payload) {
    [...new Set(userIds.filter(Boolean))].forEach((userId) => {
      this.io?.to(`user:${userId}`).emit(event, payload);
    });
  }

  emitGlobal(event, payload) {
    this.io?.emit(event, payload);
  }
}

module.exports = new SocketGateway();
