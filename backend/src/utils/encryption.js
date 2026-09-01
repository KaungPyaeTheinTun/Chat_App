const bcrypt = require("bcryptjs");
const { BCRYPT_ROUNDS } = require("../config/constants");

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
const comparePassword = (plainText, hashed) =>
  bcrypt.compare(plainText, hashed);

module.exports = {
  hashPassword,
  comparePassword,
};
