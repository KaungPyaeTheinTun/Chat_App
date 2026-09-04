ALTER TABLE messages
  ADD COLUMN reply_to_message_id INT NULL AFTER delivery_state,
  ADD COLUMN forwarded_from_message_id INT NULL AFTER reply_to_message_id,
  ADD INDEX idx_messages_reply_to (reply_to_message_id),
  ADD INDEX idx_messages_forwarded_from (forwarded_from_message_id),
  ADD CONSTRAINT fk_messages_reply_to
    FOREIGN KEY (reply_to_message_id) REFERENCES messages(message_id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_messages_forwarded_from
    FOREIGN KEY (forwarded_from_message_id) REFERENCES messages(message_id)
    ON DELETE SET NULL;

ALTER TABLE messages_archive
  ADD COLUMN reply_to_message_id INT NULL AFTER delivery_state,
  ADD COLUMN forwarded_from_message_id INT NULL AFTER reply_to_message_id,
  ADD INDEX idx_messages_archive_reply_to (reply_to_message_id),
  ADD INDEX idx_messages_archive_forwarded_from (forwarded_from_message_id);
