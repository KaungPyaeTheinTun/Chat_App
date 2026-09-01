const express = require("express");

const buildConversationRoutes = ({
  conversationController,
  authMiddleware,
}) => {
  const router = express.Router();
  router.use(authMiddleware);
  router.get("/", conversationController.list);
  return router;
};

module.exports = buildConversationRoutes;
