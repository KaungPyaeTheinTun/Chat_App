const test = require("node:test");
const assert = require("node:assert/strict");

process.env.JWT_SECRET = "test-access-secret";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";

const AuthService = require("../src/services/AuthService");
const AuthenticationException = require("../src/exceptions/AuthenticationException");
const ValidationException = require("../src/exceptions/ValidationException");

const createService = (overrides = {}) =>
  new AuthService({
    userRepository: {
      findByEmail: async () => null,
      findByUsername: async () => null,
      findById: async (userId) => ({
        user_id: userId,
        username: "tester",
        email: "tester@example.com",
        password:
          "$2a$10$M4A8q46QW0vDLRyvE4s46epC7gT8Zb0H0mzz7fQDw1s7F6Qfslzjm",
      }),
      create: async (payload) => ({
        user_id: 1,
        ...payload,
      }),
      ...overrides,
    },
    cacheService: {},
    logger: {},
  });

test("register returns enterprise session payload", async () => {
  const service = createService();
  const session = await service.register({
    username: "tester",
    email: "tester@example.com",
    password: "password123",
  });

  assert.equal(typeof session.accessToken, "string");
  assert.equal(typeof session.refreshToken, "string");
  assert.equal(session.user.username, "tester");
});

test("login rejects invalid credentials", async () => {
  const service = createService({
    findByEmail: async () => null,
  });

  await assert.rejects(
    () => service.login("missing@example.com", "wrong"),
    AuthenticationException,
  );
});

test("register rejects duplicate email", async () => {
  const service = createService({
    findByEmail: async () => ({ user_id: 9 }),
  });

  await assert.rejects(
    () =>
      service.register({
        username: "tester",
        email: "tester@example.com",
        password: "password123",
      }),
    ValidationException,
  );
});
