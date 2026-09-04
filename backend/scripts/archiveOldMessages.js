require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const Database = require("../src/config/database");
const AttachmentRepository = require("../src/repository/AttachmentRepository");
const MessageRepository = require("../src/repository/MessageRepository");
const MessageReceiptRepository = require("../src/repository/MessageReceiptRepository");
const { MESSAGE_ARCHIVE } = require("../src/config/constants");

const toMysqlDateTime = (date) =>
  date.toISOString().slice(0, 19).replace("T", " ");

const archiveBatch = async ({
  database,
  attachmentRepository,
  messageRepository,
  messageReceiptRepository,
  cutoffDate,
  batchSize,
}) => {
  const messages = await messageRepository.listArchivableBefore(
    cutoffDate,
    batchSize,
  );

  for (const message of messages) {
    await database.withTransaction(async (connection) => {
      const [receipts, attachments] = await Promise.all([
        messageReceiptRepository.listByMessageId(
          message.message_id,
          connection,
        ),
        attachmentRepository.listByMessageId(message.message_id, connection),
      ]);

      await messageRepository.archiveMessage(
        message,
        { receipts, attachments },
        connection,
      );
      await messageRepository.deleteById(message.message_id, connection);
    });
  }

  return messages.length;
};

const main = async () => {
  const database = Database.getInstance();
  const attachmentRepository = new AttachmentRepository(database);
  const messageRepository = new MessageRepository(database);
  const messageReceiptRepository = new MessageReceiptRepository(database);
  const retentionDays = MESSAGE_ARCHIVE.HOT_RETENTION_DAYS;
  const batchSize = MESSAGE_ARCHIVE.BATCH_SIZE;
  const cutoffDate = toMysqlDateTime(
    new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000),
  );
  let archivedCount = 0;
  let batchCount = 0;

  await messageRepository.ensureArchiveTable();

  do {
    batchCount = await archiveBatch({
      database,
      attachmentRepository,
      messageRepository,
      messageReceiptRepository,
      cutoffDate,
      batchSize,
    });
    archivedCount += batchCount;
  } while (batchCount === batchSize);

  console.log(
    `[ARCHIVE] Archived ${archivedCount} messages older than ${cutoffDate}`,
  );
  process.exit(0);
};

main().catch((error) => {
  console.error("[ARCHIVE] Failed to archive old messages", error);
  process.exit(1);
});
