const { RATE_LIMIT, CACHE_KEYS } = require("../config/constants");
const ApiException = require("../exceptions/ApiException");

const buildRateLimiter = (cacheService) => {
  return async (req, _res, next) => {
    try {
      const key = `${CACHE_KEYS.RATE_LIMIT}${req.ip}:${req.path}`;
      const count = await cacheService.incr(
        key,
        Math.ceil(RATE_LIMIT.WINDOW_MS / 1000),
      );

      if (count > RATE_LIMIT.MAX_REQUESTS) {
        throw new ApiException("Too many requests.", 429);
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = buildRateLimiter;
