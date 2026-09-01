const AuthenticationException = require("../exceptions/AuthenticationException");

const buildSocketAuthMiddleware = ({ authService, userService }) => {
  return async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        throw new AuthenticationException("Authentication token missing.");
      }

      const payload = await authService.verifyAccessToken(token);
      const user = await userService.getUserById(payload.userId);

      socket.auth = {
        userId: payload.userId,
      };
      socket.user = user;

      return next();
    } catch (error) {
      return next(new Error(error.message || "Authentication failed."));
    }
  };
};

module.exports = {
  buildSocketAuthMiddleware,
};
