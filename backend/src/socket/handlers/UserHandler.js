class UserHandler {
  constructor({ roomManager }) {
    this.roomManager = roomManager;
  }

  onConnect(socket) {
    this.roomManager.joinUserRoom(socket, socket.auth.userId);
  }
}

module.exports = UserHandler;
