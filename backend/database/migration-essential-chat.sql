ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP NULL AFTER status;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_type ENUM('direct', 'group') NOT NULL DEFAULT 'direct' AFTER conversation_id,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) NULL AFTER conversation_type,
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255) NULL AFTER title,
  ADD COLUMN IF NOT EXISTS created_by INT NULL AFTER avatar_url;

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_member_id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_message_id INT NULL,
  last_read_at TIMESTAMP NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_conversation_member (conversation_id, user_id),
  INDEX idx_conversation_members_user (user_id),
  INDEX idx_conversation_members_conversation (conversation_id),
  CONSTRAINT fk_conversation_members_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_conversation_members_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

INSERT IGNORE INTO conversation_members (conversation_id, user_id, role)
SELECT conversation_id, participant_1_id, 'owner'
FROM conversations
WHERE participant_1_id IS NOT NULL;

INSERT IGNORE INTO conversation_members (conversation_id, user_id, role)
SELECT conversation_id, participant_2_id, 'member'
FROM conversations
WHERE participant_2_id IS NOT NULL;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS client_message_id VARCHAR(80) NULL AFTER message_id,
  MODIFY COLUMN receiver_id INT NULL,
  MODIFY COLUMN message_type ENUM('text', 'image', 'audio', 'video', 'document') DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS delivery_state ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent' AFTER message_type;

UPDATE messages
SET client_message_id = CONCAT('legacy-', message_id)
WHERE client_message_id IS NULL;

ALTER TABLE messages
  MODIFY COLUMN client_message_id VARCHAR(80) NOT NULL;

CREATE TABLE IF NOT EXISTS message_receipts (
  message_receipt_id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_message_receipt_user (message_id, user_id),
  INDEX idx_message_receipts_conversation_user (conversation_id, user_id),
  CONSTRAINT fk_message_receipts_message
    FOREIGN KEY (message_id) REFERENCES messages(message_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_message_receipts_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_message_receipts_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

INSERT IGNORE INTO message_receipts
  (message_id, conversation_id, user_id, delivered_at, read_at)
SELECT
  m.message_id,
  m.conversation_id,
  cm.user_id,
  CASE WHEN m.is_read = TRUE THEN m.updated_at ELSE NULL END,
  CASE WHEN m.is_read = TRUE THEN m.updated_at ELSE NULL END
FROM messages m
JOIN conversation_members cm
  ON cm.conversation_id = m.conversation_id
  AND cm.user_id <> m.sender_id;

CREATE TABLE IF NOT EXISTS attachments (
  attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  mime_type VARCHAR(120) NULL,
  file_size INT NULL,
  original_name VARCHAR(255) NULL,
  upload_state ENUM('uploaded', 'failed') NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_message
    FOREIGN KEY (message_id) REFERENCES messages(message_id)
    ON DELETE CASCADE
);

INSERT IGNORE INTO attachments (message_id, file_url, upload_state)
SELECT message_id, content, 'uploaded'
FROM messages
WHERE message_type = 'image' AND content LIKE '/uploads/%';

CREATE TABLE IF NOT EXISTS device_tokens (
  device_token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  platform ENUM('ios', 'android', 'web') NOT NULL,
  device_id VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_device_token (token),
  INDEX idx_device_tokens_user (user_id, is_active),
  CONSTRAINT fk_device_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE UNIQUE INDEX unique_sender_client_message
  ON messages (sender_id, client_message_id);
