const jwt = require("jsonwebtoken");
const {
  JWT_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
} = require("../config/constants");

const signAccessToken = (userId) =>
  jwt.sign({ userId, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });

const signRefreshToken = (userId) =>
  jwt.sign({ userId, type: "refresh" }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
