const ValidationException = require("../../exceptions/ValidationException");

class Message {
  constructor(data = {}) {
    this.messageId = data.message_id || data.messageId || null;
    this.clientMessageId =
      data.client_message_id || data.clientMessageId || null;
    this.conversationId = data.conversation_id || data.conversationId || null;
    this.senderId = data.sender_id || data.senderId || null;
    this.receiverId = data.receiver_id || data.receiverId || null;
    this.content = data.content || null;
    this.messageType = data.message_type || data.messageType || "text";
    this.deliveryState = data.delivery_state || data.deliveryState || "sent";
    this.replyToMessageId =
      data.reply_to_message_id || data.replyToMessageId || null;
    this.forwardedFromMessageId =
      data.forwarded_from_message_id || data.forwardedFromMessageId || null;
    this.repliedMessage = data.repliedMessage || null;
    this.forwardedFromMessage = data.forwardedFromMessage || null;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  validate() {
    const errors = [];

    if (!this.content || !String(this.content).trim()) {
      errors.push("Message content cannot be empty.");
    }

    if (!this.senderId) {
      errors.push("Sender is required.");
    }

    if (errors.length) {
      throw new ValidationException("Invalid message payload.", errors);
    }
  }

  toJSON() {
    return {
      messageId: this.messageId,
      clientMessageId: this.clientMessageId,
      conversationId: this.conversationId,
      senderId: this.senderId,
      receiverId: this.receiverId,
      content: this.content,
      messageType: this.messageType,
      deliveryState: this.deliveryState,
      replyToMessageId: this.replyToMessageId,
      forwardedFromMessageId: this.forwardedFromMessageId,
      repliedMessage: this.repliedMessage,
      forwardedFromMessage: this.forwardedFromMessage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Message;
