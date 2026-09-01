const ApiException = require("./ApiException");

class ValidationException extends ApiException {
  constructor(message = "Validation failed.", details = null) {
    super(message, 422, details);
  }
}

module.exports = ValidationException;
