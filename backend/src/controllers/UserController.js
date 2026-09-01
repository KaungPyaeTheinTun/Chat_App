const BaseController = require("./base/BaseController");
const AuthorizationException = require("../exceptions/AuthorizationException");
const ValidationException = require("../exceptions/ValidationException");

class UserController extends BaseController {
  constructor(userService) {
    super();
    this.userService = userService;

    this.list = this.handleRequest(async (req, res) => {
      const users = await this.userService.listUsers(req.user.userId);
      return this.listResponse(
        res,
        "Users fetched successfully.",
        "users",
        users,
      );
    });

    this.profile = this.handleRequest(async (req, res) => {
      const user = await this.userService.getUserById(Number(req.params.id));
      return this.detailResponse(
        res,
        "User profile fetched successfully.",
        "user",
        user,
      );
    });

    this.update = this.handleRequest(async (req, res) => {
      if (req.user.userId !== Number(req.params.id)) {
        throw new AuthorizationException(
          "You can only update your own profile.",
        );
      }

      const user = await this.userService.updateProfile(
        Number(req.params.id),
        req.body,
      );
      return this.detailResponse(
        res,
        "User profile updated successfully.",
        "user",
        user,
      );
    });

    this.uploadAvatar = this.handleRequest(async (req, res) => {
      if (req.user.userId !== Number(req.params.id)) {
        throw new AuthorizationException(
          "You can only update your own profile.",
        );
      }

      if (!req.file) {
        throw new ValidationException("Avatar image is required.");
      }

      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      const user = await this.userService.updateAvatar(
        Number(req.params.id),
        avatarPath,
      );

      return this.detailResponse(
        res,
        "Avatar updated successfully.",
        "user",
        user,
      );
    });

    this.status = this.handleRequest(async (req, res) => {
      const user = await this.userService.getUserById(Number(req.params.id));
      return this.ok(res, "User status fetched successfully.", {
        userId: user.userId,
        status: user.status,
      });
    });
  }
}

module.exports = UserController;
