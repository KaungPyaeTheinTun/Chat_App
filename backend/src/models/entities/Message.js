const ValidationException = require("../../exceptions/ValidationException");

class Message {
  constructor(data = {}) {
    this.messageId = data.message_id || data.messageId || null;
    this.conversationId = data.conversation_id || data.conversationId || null;
    this.senderId = data.sender_id || data.senderId || null;
    this.receiverId = data.receiver_id || data.receiverId || null;
    this.content = data.content || null;
    this.messageType = data.message_type || data.messageType || "text";
    this.isRead = Boolean(data.is_read ?? data.isRead ?? false);
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  validate() {
    const errors = [];

    if (!this.content || !String(this.content).trim()) {
      errors.push("Message content cannot be empty.");
    }

    if (!this.senderId || !this.receiverId) {
      errors.push("Sender and receiver are required.");
    }

    if (errors.length) {
      throw new ValidationException("Invalid message payload.", errors);
    }
  }

  toJSON() {
    return {
      messageId: this.messageId,
      conversationId: this.conversationId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      content: this.content,
      messageType: this.messageType,
      isRead: this.isRead,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Message;
