const logger = require("../utils/logger");

const loggingMiddleware = (req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
  });
  next();
};

module.exports = loggingMiddleware;
