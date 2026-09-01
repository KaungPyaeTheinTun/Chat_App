const ApiException = require("./ApiException");

class AuthorizationException extends ApiException {
  constructor(message = "Forbidden.") {
    super(message, 403);
  }
}

module.exports = AuthorizationException;
