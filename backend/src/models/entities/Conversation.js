const ValidationException = require("../../exceptions/ValidationException");

class Conversation {
  constructor(data = {}) {
    this.conversationId = data.conversation_id || data.conversationId || null;
    this.participant1Id = data.participant_1_id || data.participant1Id || null;
    this.participant2Id = data.participant_2_id || data.participant2Id || null;
    this.lastMessageId = data.last_message_id || data.lastMessageId || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  validate() {
    const errors = [];

    if (!this.participant1Id || !this.participant2Id) {
      errors.push("Conversation participants are required.");
    }

    if (this.participant1Id === this.participant2Id) {
      errors.push("Conversation participants must be different.");
    }

    if (errors.length) {
      throw new ValidationException("Invalid conversation payload.", errors);
    }
  }
}

module.exports = Conversation;
