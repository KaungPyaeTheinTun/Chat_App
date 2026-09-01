CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  status ENUM('online', 'offline') DEFAULT 'offline',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id INT AUTO_INCREMENT PRIMARY KEY,
  participant_1_id INT NOT NULL,
  participant_2_id INT NOT NULL,
  last_message_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversations_user1
    FOREIGN KEY (participant_1_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_conversations_user2
    FOREIGN KEY (participant_2_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (participant_1_id, participant_2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text', 'image') DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id),
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id)
);

ALTER TABLE conversations
  ADD CONSTRAINT fk_conversations_last_message
  FOREIGN KEY (last_message_id) REFERENCES messages(message_id)
  ON DELETE SET NULL;
