class RoomManager {
  userRoom(userId) {
    return `user:${userId}`;
  }

  conversationRoom(conversationId) {
    return `conversation:${conversationId}`;
  }

  joinUserRoom(socket, userId) {
    socket.join(this.userRoom(userId));
  }

  joinConversationRoom(socket, conversationId) {
    socket.join(this.conversationRoom(conversationId));
  }

  leaveConversationRoom(socket, conversationId) {
    socket.leave(this.conversationRoom(conversationId));
  }
}

module.exports = RoomManager;
