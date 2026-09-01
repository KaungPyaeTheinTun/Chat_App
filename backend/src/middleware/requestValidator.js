const { validationResult } = require("express-validator");
const ValidationException = require("../exceptions/ValidationException");

const requestValidator = (req, _res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return next(new ValidationException("Validation failed.", result.array()));
  }

  return next();
};

module.exports = requestValidator;
