const { sendSuccess } = require("../../utils/response");

class BaseController {
  handleRequest(action) {
    return async (req, res, next) => {
      try {
        return await action(req, res, next);
      } catch (error) {
        return next(error);
      }
    };
  }

  ok(res, message, data = null, statusCode = 200) {
    return sendSuccess(res, message, data, statusCode);
  }

  created(res, message, data = null) {
    return this.ok(res, message, data, 201);
  }

  deleted(res, message, data = null) {
    return this.ok(res, message, data, 200);
  }

  listResponse(res, message, key, items, statusCode = 200) {
    return this.ok(res, message, { [key]: items }, statusCode);
  }

  detailResponse(res, message, key, item, statusCode = 200) {
    return this.ok(res, message, { [key]: item }, statusCode);
  }
}

module.exports = BaseController;
