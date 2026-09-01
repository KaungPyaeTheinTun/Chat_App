const AuthenticationException = require("../exceptions/AuthenticationException");

const buildAuthMiddleware = (authService) => {
  return async (req, _res, next) => {
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null;

      if (!token) {
        throw new AuthenticationException("Authorization token missing.");
      }

      const payload = await authService.verifyAccessToken(token);
      req.user = {
        userId: payload.userId,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = buildAuthMiddleware;
