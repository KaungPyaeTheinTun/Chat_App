const express = require("express");
const { body } = require("express-validator");
const requestValidator = require("../middleware/requestValidator");

const buildAuthRoutes = ({ authController, authMiddleware }) => {
  const router = express.Router();

  router.post(
    "/register",
    [
      body("username").trim().isLength({ min: 3, max: 30 }),
      body("email").isEmail(),
      body("password").isLength({ min: 6 }),
    ],
    requestValidator,
    authController.register,
  );

  router.post(
    "/login",
    [body("email").isEmail(), body("password").isLength({ min: 6 })],
    requestValidator,
    authController.login,
  );

  router.post(
    "/refresh",
    [body("refreshToken").notEmpty()],
    requestValidator,
    authController.refresh,
  );
  router.post("/logout", authMiddleware, authController.logout);
  router.get("/verify", authMiddleware, authController.verify);

  return router;
};

module.exports = buildAuthRoutes;
