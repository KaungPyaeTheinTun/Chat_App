-- Canonical ChatApp database schema.
-- Docker uses this file to initialize a fresh MySQL database.

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  status ENUM('online', 'offline') DEFAULT 'offline',
  last_seen_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_type ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
  title VARCHAR(255) NULL,
  avatar_url VARCHAR(255) NULL,
  created_by INT NULL,
  last_message_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversations_creator
    FOREIGN KEY (created_by) REFERENCES users(user_id)
    ON DELETE SET NULL,
  INDEX idx_conversation_type (conversation_type),
  INDEX idx_conversation_updated_at (updated_at)
);

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
  CONSTRAINT fk_conversation_members_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_conversation_members_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  INDEX idx_conversation_members_user (user_id),
  INDEX idx_conversation_members_conversation (conversation_id)
);

CREATE TABLE IF NOT EXISTS messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  client_message_id VARCHAR(80) NOT NULL,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text', 'image', 'audio', 'video', 'document') DEFAULT 'text',
  delivery_state ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_sender_client_message (sender_id, client_message_id),
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
    ON DELETE SET NULL,
  INDEX idx_messages_conversation_cursor (conversation_id, message_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_receiver (receiver_id)
);

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
  CONSTRAINT fk_message_receipts_message
    FOREIGN KEY (message_id) REFERENCES messages(message_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_message_receipts_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_message_receipts_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  INDEX idx_message_receipts_conversation_user (conversation_id, user_id)
);

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
  CONSTRAINT fk_device_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  INDEX idx_device_tokens_user (user_id, is_active)
);

ALTER TABLE conversation_members
  ADD CONSTRAINT fk_conversation_members_last_read
  FOREIGN KEY (last_read_message_id) REFERENCES messages(message_id)
  ON DELETE SET NULL;

ALTER TABLE conversations
  ADD CONSTRAINT fk_conversations_last_message
  FOREIGN KEY (last_message_id) REFERENCES messages(message_id)
  ON DELETE SET NULL;
