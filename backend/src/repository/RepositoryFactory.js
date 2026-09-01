const UserRepository = require("./UserRepository");
const MessageRepository = require("./MessageRepository");
const ConversationRepository = require("./ConversationRepository");

class RepositoryFactory {
  static build(database) {
    return {
      userRepository: new UserRepository(database),
      messageRepository: new MessageRepository(database),
      conversationRepository: new ConversationRepository(database),
    };
  }
}

module.exports = RepositoryFactory;
