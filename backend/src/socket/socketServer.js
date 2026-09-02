const { Server } = require("socket.io");
const { buildSocketAuthMiddleware } = require("../config/socketConfig");
const RoomManager = require("./managers/RoomManager");
const ConnectionManager = require("./managers/ConnectionManager");
const MessageHandler = require("./handlers/MessageHandler");
const PresenceHandler = require("./handlers/PresenceHandler");
const UserHandler = require("./handlers/UserHandler");

const buildSocketServer = (httpServer, services) => {
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.SOCKET_CORS_ORIGIN?.split(",").map((item) => item.trim()) ||
        "*",
      credentials: true,
    },
  });

  const roomManager = new RoomManager();
  const connectionManager = new ConnectionManager(
    services.cacheService,
    services.userService,
  );
  const messageHandler = new MessageHandler({
    roomManager,
    messageService: services.messageService,
    cacheService: services.cacheService,
  });
  const presenceHandler = new PresenceHandler({
    connectionManager,
    socketGateway: services.socketGateway,
  });
  const userHandler = new UserHandler({ roomManager });

  io.use(
    buildSocketAuthMiddleware({
      authService: services.authService,
      userService: services.userService,
    }),
  );

  io.on("connection", async (socket) => {
    userHandler.onConnect(socket);
    messageHandler.register(socket);
    await presenceHandler.onConnect(socket);

    socket.on("disconnect", async () => {
      await presenceHandler.onDisconnect(socket);
    });
  });

  services.socketGateway.setServer(io);

  return io;
};

module.exports = buildSocketServer;
