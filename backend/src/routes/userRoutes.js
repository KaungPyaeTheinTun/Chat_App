const express = require("express");
const { body } = require("express-validator");
const requestValidator = require("../middleware/requestValidator");
const { uploadAvatar } = require("../middleware/uploadMiddleware");

const buildUserRoutes = ({ userController, authMiddleware }) => {
  const router = express.Router();

  router.use(authMiddleware);
  router.get("/", userController.list);
  router.get("/status/:id", userController.status);
  router.post(
    "/:id/avatar",
    uploadAvatar.single("avatar"),
    userController.uploadAvatar,
  );
  router.get("/:id", userController.profile);
  router.put(
    "/:id",
    [body("username").optional().trim().isLength({ min: 3, max: 30 })],
    requestValidator,
    userController.update,
  );

  return router;
};

module.exports = buildUserRoutes;
