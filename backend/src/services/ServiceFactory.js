const CacheService = require("./CacheService");
const AuthService = require("./AuthService");
const UserService = require("./UserService");
const ConversationService = require("./ConversationService");
const MessageService = require("./MessageService");
const socketGateway = require("../socket/socketGateway");
const logger = require("../utils/logger");

class ServiceFactory {
  static build({ database, repositories }) {
    const cacheService = new CacheService();
    const shared = { cacheService, logger };

    const authService = new AuthService({
      userRepository: repositories.userRepository,
      ...shared,
    });

    const userService = new UserService({
      userRepository: repositories.userRepository,
      deviceTokenRepository: repositories.deviceTokenRepository,
      conversationMemberRepository: repositories.conversationMemberRepository,
      ...shared,
    });

    const conversationService = new ConversationService({
      conversationRepository: repositories.conversationRepository,
      conversationMemberRepository: repositories.conversationMemberRepository,
      userRepository: repositories.userRepository,
      ...shared,
    });

    const messageService = new MessageService({
      database,
      messageRepository: repositories.messageRepository,
      conversationRepository: repositories.conversationRepository,
      conversationMemberRepository: repositories.conversationMemberRepository,
      messageReceiptRepository: repositories.messageReceiptRepository,
      attachmentRepository: repositories.attachmentRepository,
      socketGateway,
      ...shared,
    });

    return {
      cacheService,
      authService,
      userService,
      conversationService,
      messageService,
      socketGateway,
      logger,
    };
  }
}

module.exports = ServiceFactory;
