const { USER_STATUS } = require("../../config/constants");

class PresenceHandler {
  constructor({ connectionManager, socketGateway }) {
    this.connectionManager = connectionManager;
    this.socketGateway = socketGateway;
  }

  async onConnect(socket) {
    await this.connectionManager.connect(socket.auth.userId, socket.id);
    this.socketGateway.emitGlobal("presence:changed", {
      userId: socket.auth.userId,
      status: USER_STATUS.ONLINE,
    });
  }

  async onDisconnect(socket) {
    const status = await this.connectionManager.disconnect(
      socket.auth.userId,
      socket.id,
    );
    this.socketGateway.emitGlobal("presence:changed", {
      userId: socket.auth.userId,
      status,
    });
  }
}

module.exports = PresenceHandler;
