const ApiException = require("./ApiException");

class AuthenticationException extends ApiException {
  constructor(message = "Authentication failed.") {
    super(message, 401);
  }
}

module.exports = AuthenticationException;
