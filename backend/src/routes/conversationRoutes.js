const express = require("express");
const { body } = require("express-validator");
const requestValidator = require("../middleware/requestValidator");
const { uploadGroupAvatar } = require("../middleware/uploadMiddleware");

const buildConversationRoutes = ({
  conversationController,
  authMiddleware,
}) => {
  const router = express.Router();
  router.use(authMiddleware);

  router.get("/", conversationController.list);
  router.post(
    "/direct",
    [body("userId").isInt({ min: 1 })],
    requestValidator,
    conversationController.createDirect,
  );
  router.post(
    "/group",
    [
      body("title").trim().notEmpty(),
      body("memberIds").isArray({ min: 1 }),
      body("memberIds.*").isInt({ min: 1 }),
    ],
    requestValidator,
    conversationController.createGroup,
  );
  router.patch(
    "/:conversationId/preferences",
    [
      body("isArchived").optional().isBoolean(),
      body("isMuted").optional().isBoolean(),
      body("isPinned").optional().isBoolean(),
      body("isDeleted").optional().isBoolean(),
    ],
    requestValidator,
    conversationController.preferences,
  );
  router.post("/:conversationId/leave", conversationController.leave);
  router.patch(
    "/:conversationId/group",
    [body("title").optional().trim().notEmpty()],
    requestValidator,
    conversationController.updateGroupProfile,
  );
  router.post(
    "/:conversationId/group/avatar",
    uploadGroupAvatar.single("avatar"),
    conversationController.uploadGroupAvatar,
  );
  router.post(
    "/:conversationId/members",
    [
      body("memberIds").isArray({ min: 1 }),
      body("memberIds.*").isInt({ min: 1 }),
    ],
    requestValidator,
    conversationController.addMembers,
  );
  router.delete(
    "/:conversationId/members/:memberId",
    conversationController.removeMember,
  );

  return router;
};

module.exports = buildConversationRoutes;
