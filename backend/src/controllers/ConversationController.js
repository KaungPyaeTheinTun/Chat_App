const BaseController = require("./base/BaseController");

class ConversationController extends BaseController {
  constructor(conversationService) {
    super();
    this.conversationService = conversationService;

    this.list = this.handleRequest(async (req, res) => {
      const conversations = await this.conversationService.listForUser(
        req.user.userId,
      );
      return this.listResponse(
        res,
        "Conversations fetched successfully.",
        "conversations",
        conversations,
      );
    });
  }
}

module.exports = ConversationController;
