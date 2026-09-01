const BaseService = require("./base/BaseService");
const User = require("../models/entities/User");
const AuthenticationException = require("../exceptions/AuthenticationException");
const ValidationException = require("../exceptions/ValidationException");
const { comparePassword, hashPassword } = require("../utils/encryption");
const {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} = require("../utils/tokenManager");

class AuthService extends BaseService {
  constructor({ userRepository, cacheService, logger }) {
    super({ cacheService, logger });
    this.userRepository = userRepository;
  }

  async register(payload) {
    const user = new User(payload);
    user.validateForCreate();

    const existingEmail = await this.userRepository.findByEmail(user.email);
    if (existingEmail) {
      throw new ValidationException("Email is already registered.");
    }

    const existingUsername = await this.userRepository.findByUsername(
      user.username,
    );
    if (existingUsername) {
      throw new ValidationException("Username is already taken.");
    }

    const created = await this.userRepository.create({
      username: user.username.trim(),
      email: user.email.trim(),
      password: await hashPassword(user.password),
    });

    const publicUser = new User(created).toPublicJSON();
    return this.buildSession(publicUser);
  }

  async login(email, password) {
    const userRecord = await this.userRepository.findByEmail(email);

    if (
      !userRecord ||
      !(await comparePassword(password, userRecord.password))
    ) {
      throw new AuthenticationException("Invalid email or password.");
    }

    return this.buildSession(new User(userRecord).toPublicJSON());
  }

  buildSession(user) {
    return {
      accessToken: signAccessToken(user.userId),
      refreshToken: signRefreshToken(user.userId),
      user,
    };
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AuthenticationException("Refresh token missing.");
    }

    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AuthenticationException("Invalid or expired refresh token.");
    }

    const userRecord = await this.userRepository.findById(payload.userId);

    if (!userRecord) {
      throw new AuthenticationException("User not found.");
    }

    return this.buildSession(new User(userRecord).toPublicJSON());
  }

  async verifyAccessToken(token) {
    try {
      return verifyAccessToken(token);
    } catch (error) {
      throw new AuthenticationException("Invalid or expired token.");
    }
  }
}

module.exports = AuthService;
