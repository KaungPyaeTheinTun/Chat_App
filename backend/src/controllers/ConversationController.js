const BaseController = require("./base/BaseController");
const ValidationException = require("../exceptions/ValidationException");

class ConversationController extends BaseController {
  constructor(conversationService) {
    super();
    this.conversationService = conversationService;

    this.list = this.handleRequest(async (req, res) => {
      const conversations = await this.conversationService.listForUser(
        req.user.userId,
        {
          includeArchived: req.query.includeArchived === "true",
        },
      );
      return this.listResponse(
        res,
        "Conversations fetched successfully.",
        "conversations",
        conversations,
      );
    });

    this.createDirect = this.handleRequest(async (req, res) => {
      const conversation = await this.conversationService.createDirect(
        req.user.userId,
        Number(req.body.userId),
      );
      return this.created(res, "Conversation created successfully.", {
        conversation,
      });
    });

    this.createGroup = this.handleRequest(async (req, res) => {
      const conversation = await this.conversationService.createGroup(
        req.user.userId,
        {
          title: req.body.title,
          memberIds: req.body.memberIds || [],
        },
      );
      return this.created(res, "Group conversation created successfully.", {
        conversation,
      });
    });

    this.preferences = this.handleRequest(async (req, res) => {
      const result = await this.conversationService.updatePreferences(
        req.user.userId,
        Number(req.params.conversationId),
        req.body,
      );
      return this.ok(res, "Conversation preferences updated.", result);
    });

    this.leave = this.handleRequest(async (req, res) => {
      const result = await this.conversationService.leaveConversation(
        req.user.userId,
        Number(req.params.conversationId),
      );
      return this.ok(res, "Conversation left successfully.", result);
    });

    this.updateGroupProfile = this.handleRequest(async (req, res) => {
      const conversation = await this.conversationService.updateGroupProfile(
        req.user.userId,
        Number(req.params.conversationId),
        {
          title: req.body.title,
        },
      );
      return this.ok(res, "Group profile updated.", { conversation });
    });

    this.uploadGroupAvatar = this.handleRequest(async (req, res) => {
      if (!req.file) {
        throw new ValidationException("Group image is required.");
      }

      const conversation = await this.conversationService.updateGroupProfile(
        req.user.userId,
        Number(req.params.conversationId),
        {
          avatarUrl: `/uploads/groups/${req.file.filename}`,
        },
      );
      return this.ok(res, "Group image updated.", { conversation });
    });

    this.addMembers = this.handleRequest(async (req, res) => {
      const conversation = await this.conversationService.addGroupMembers(
        req.user.userId,
        Number(req.params.conversationId),
        req.body.memberIds || [],
      );
      return this.ok(res, "Group members added.", { conversation });
    });

    this.removeMember = this.handleRequest(async (req, res) => {
      const conversation = await this.conversationService.removeGroupMember(
        req.user.userId,
        Number(req.params.conversationId),
        Number(req.params.memberId),
      );
      return this.ok(res, "Group member removed.", { conversation });
    });
  }
}

module.exports = ConversationController;
