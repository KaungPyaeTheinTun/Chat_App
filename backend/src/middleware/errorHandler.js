const ApiException = require("../exceptions/ApiException");
const { sendError } = require("../utils/response");
const logger = require("../utils/logger");

const errorHandler = (error, _req, res, _next) => {
  const normalizedError =
    error instanceof ApiException
      ? error
      : new ApiException(error.message || "Internal server error.", 500);

  if (normalizedError.statusCode >= 500) {
    logger.error(normalizedError.message, normalizedError);
  }

  return sendError(res, normalizedError);
};

module.exports = errorHandler;
