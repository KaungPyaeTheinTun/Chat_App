const UserRepository = require("./UserRepository");
const MessageRepository = require("./MessageRepository");
const ConversationRepository = require("./ConversationRepository");
const ConversationMemberRepository = require("./ConversationMemberRepository");
const MessageReceiptRepository = require("./MessageReceiptRepository");
const AttachmentRepository = require("./AttachmentRepository");
const DeviceTokenRepository = require("./DeviceTokenRepository");

class RepositoryFactory {
  static build(database) {
    return {
      userRepository: new UserRepository(database),
      messageRepository: new MessageRepository(database),
      conversationRepository: new ConversationRepository(database),
      conversationMemberRepository: new ConversationMemberRepository(database),
      messageReceiptRepository: new MessageReceiptRepository(database),
      attachmentRepository: new AttachmentRepository(database),
      deviceTokenRepository: new DeviceTokenRepository(database),
    };
  }
}

module.exports = RepositoryFactory;
