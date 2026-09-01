const BaseController = require("./base/BaseController");
const ValidationException = require("../exceptions/ValidationException");

class MessageController extends BaseController {
  constructor(messageService) {
    super();
    this.messageService = messageService;

    this.list = this.handleRequest(async (req, res) => {
      const messages = await this.messageService.listMessages(
        req.user.userId,
        Number(req.params.conversationId),
        req.query.limit,
        req.query.offset,
      );

      return this.listResponse(
        res,
        "Messages fetched successfully.",
        "messages",
        messages,
      );
    });

    this.send = this.handleRequest(async (req, res) => {
      const result = await this.messageService.sendMessage({
        senderId: req.user.userId,
        receiverId: Number(req.body.receiverId),
        content: req.body.content,
        messageType: req.body.messageType,
      });

      return this.created(res, "Message sent successfully.", result);
    });

    this.sendImage = this.handleRequest(async (req, res) => {
      if (!req.file) {
        throw new ValidationException("Image file is required.");
      }

      const result = await this.messageService.sendUploadedImageMessage({
        senderId: req.user.userId,
        receiverId: Number(req.body.receiverId),
        imagePath: `/uploads/messages/${req.file.filename}`,
      });

      return this.created(res, "Image message sent successfully.", result);
    });

    this.edit = this.handleRequest(async (req, res) => {
      const result = await this.messageService.editMessage(
        req.user.userId,
        Number(req.params.id),
        req.body.content,
      );

      return this.ok(res, "Message updated successfully.", result);
    });

    this.remove = this.handleRequest(async (req, res) => {
      const result = await this.messageService.deleteMessage(
        req.user.userId,
        Number(req.params.id),
      );

      return this.deleted(res, "Message deleted successfully.", result);
    });

    this.search = this.handleRequest(async (req, res) => {
      const results = await this.messageService.searchMessages(
        req.user.userId,
        req.query.q,
      );
      return this.listResponse(
        res,
        "Message search completed.",
        "messages",
        results,
      );
    });

    this.markRead = this.handleRequest(async (req, res) => {
      const result = await this.messageService.markConversationRead(
        req.user.userId,
        Number(req.params.conversationId),
      );

      return this.ok(res, "Conversation marked as read.", result);
    });
  }
}

module.exports = MessageController;
