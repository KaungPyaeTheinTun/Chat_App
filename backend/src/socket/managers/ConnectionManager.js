const { USER_STATUS } = require("../../config/constants");

class ConnectionManager {
  constructor(cacheService, userService) {
    this.cacheService = cacheService;
    this.userService = userService;
    this.connections = new Map();
  }

  async connect(userId, socketId) {
    const sockets = this.connections.get(userId) || new Set();
    sockets.add(socketId);
    this.connections.set(userId, sockets);
    await this.cacheService.set(`presence:${userId}`, {
      userId,
      socketCount: sockets.size,
      status: USER_STATUS.ONLINE,
    });
    await this.userService.updateStatus(userId, USER_STATUS.ONLINE);
  }

  async disconnect(userId, socketId) {
    const sockets = this.connections.get(userId) || new Set();
    sockets.delete(socketId);

    if (!sockets.size) {
      this.connections.delete(userId);
      await this.cacheService.set(`presence:${userId}`, {
        userId,
        socketCount: 0,
        status: USER_STATUS.OFFLINE,
      });
      await this.userService.updateStatus(userId, USER_STATUS.OFFLINE);
      return USER_STATUS.OFFLINE;
    }

    this.connections.set(userId, sockets);
    await this.cacheService.set(`presence:${userId}`, {
      userId,
      socketCount: sockets.size,
      status: USER_STATUS.ONLINE,
    });
    return USER_STATUS.ONLINE;
  }
}

module.exports = ConnectionManager;
