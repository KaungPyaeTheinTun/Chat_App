const BaseController = require("./base/BaseController");

class AuthController extends BaseController {
  constructor(authService, userService) {
    super();
    this.authService = authService;
    this.userService = userService;

    this.register = this.handleRequest(async (req, res) => {
      const session = await this.authService.register(req.body);
      return this.created(res, "User registered successfully.", session);
    });

    this.login = this.handleRequest(async (req, res) => {
      const session = await this.authService.login(
        req.body.email,
        req.body.password,
      );
      return this.ok(res, "Login successful.", session);
    });

    this.refresh = this.handleRequest(async (req, res) => {
      const session = await this.authService.refresh(req.body.refreshToken);
      return this.ok(res, "Token refreshed.", session);
    });

    this.verify = this.handleRequest(async (req, res) => {
      const user = await this.userService.getUserById(req.user.userId);
      return this.detailResponse(res, "Token is valid.", "user", user);
    });

    this.logout = this.handleRequest(async (_req, res) => {
      return this.ok(res, "Logout successful.", { success: true });
    });
  }
}

module.exports = AuthController;
