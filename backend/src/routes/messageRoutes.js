const express = require("express");
const { body } = require("express-validator");
const requestValidator = require("../middleware/requestValidator");
const { uploadMessageImage } = require("../middleware/uploadMiddleware");

const buildMessageRoutes = ({ messageController, authMiddleware }) => {
  const router = express.Router();
  router.use(authMiddleware);

  router.get("/search", messageController.search);
  router.get("/conversation/:conversationId", messageController.list);
  router.post(
    "/",
    [
      body("content").trim().notEmpty(),
      body("clientMessageId").optional().isString().isLength({ max: 80 }),
      body("conversationId").optional().isInt({ min: 1 }),
      body("receiverId").optional().isInt({ min: 1 }),
      body("messageType")
        .optional()
        .isIn(["text", "image", "audio", "video", "document"]),
    ],
    requestValidator,
    messageController.send,
  );
  router.post(
    "/image",
    uploadMessageImage.single("image"),
    [
      body("clientMessageId").optional().isString().isLength({ max: 80 }),
      body("conversationId").optional().isInt({ min: 1 }),
      body("receiverId").optional().isInt({ min: 1 }),
    ],
    requestValidator,
    messageController.sendImage,
  );
  router.patch(
    "/:id",
    [body("content").trim().notEmpty()],
    requestValidator,
    messageController.edit,
  );
  router.delete("/:id", messageController.remove);
  router.post(
    "/conversation/:conversationId/delivered",
    messageController.markDelivered,
  );
  router.post("/conversation/:conversationId/read", messageController.markRead);

  return router;
};

module.exports = buildMessageRoutes;
