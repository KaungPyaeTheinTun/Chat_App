const path = require("path");
const express = require("express");
const Database = require("./config/database");
const RepositoryFactory = require("./repository/RepositoryFactory");
const ServiceFactory = require("./services/ServiceFactory");
const buildAuthMiddleware = require("./middleware/authMiddleware");
const buildRateLimiter = require("./middleware/rateLimiter");
const corsMiddleware = require("./middleware/corsMiddleware");
const loggingMiddleware = require("./middleware/loggingMiddleware");
const sanitizer = require("./middleware/sanitizer");
const errorHandler = require("./middleware/errorHandler");
const { API_PREFIX } = require("./config/constants");
const AuthController = require("./controllers/AuthController");
const UserController = require("./controllers/UserController");
const ConversationController = require("./controllers/ConversationController");
const MessageController = require("./controllers/MessageController");
const buildAuthRoutes = require("./routes/authRoutes");
const buildUserRoutes = require("./routes/userRoutes");
const buildConversationRoutes = require("./routes/conversationRoutes");
const buildMessageRoutes = require("./routes/messageRoutes");

const createApp = () => {
  const app = express();
  const database = Database.getInstance();
  const repositories = RepositoryFactory.build(database);
  const services = ServiceFactory.build({ database, repositories });
  const authMiddleware = buildAuthMiddleware(services.authService);
  const rateLimiter = buildRateLimiter(services.cacheService);

  const authController = new AuthController(
    services.authService,
    services.userService,
  );
  const userController = new UserController(services.userService);
  const conversationController = new ConversationController(
    services.conversationService,
  );
  const messageController = new MessageController(services.messageService);

  app.use(corsMiddleware);
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
  app.use(express.json({ limit: "1mb" }));
  app.use(loggingMiddleware);
  app.use(sanitizer);
  app.use(rateLimiter);

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      message: "Chat backend is healthy.",
      data: {
        uptime: process.uptime(),
      },
    });
  });

  app.use(
    `${API_PREFIX}/auth`,
    buildAuthRoutes({
      authController,
      authMiddleware,
    }),
  );
  app.use(
    `${API_PREFIX}/users`,
    buildUserRoutes({
      userController,
      authMiddleware,
    }),
  );
  app.use(
    `${API_PREFIX}/conversations`,
    buildConversationRoutes({
      conversationController,
      authMiddleware,
    }),
  );
  app.use(
    `${API_PREFIX}/messages`,
    buildMessageRoutes({
      messageController,
      authMiddleware,
    }),
  );

  app.use(errorHandler);

  return {
    app,
    services,
  };
};

module.exports = createApp;
