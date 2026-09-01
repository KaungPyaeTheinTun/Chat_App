const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ValidationException = require("../exceptions/ValidationException");

const ensureDirectory = (target) => {
  fs.mkdirSync(target, { recursive: true });
};

const createStorage = (folderName, fallbackName) => {
  const targetDirectory = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    folderName,
  );
  ensureDirectory(targetDirectory);

  return multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, targetDirectory);
    },
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname || "") || ".jpg";
      const safeBaseName = path
        .basename(file.originalname || fallbackName, extension)
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 40);
      callback(
        null,
        `${Date.now()}-${safeBaseName || fallbackName}${extension}`,
      );
    },
  });
};

const imageFileFilter = (_req, file, callback) => {
  if (!file.mimetype?.startsWith("image/")) {
    callback(new ValidationException("Only image uploads are allowed."));
    return;
  }

  callback(null, true);
};

const createImageUpload = (folderName, fallbackName) =>
  multer({
    storage: createStorage(folderName, fallbackName),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: imageFileFilter,
  });

module.exports = {
  uploadAvatar: createImageUpload("avatars", "avatar"),
  uploadMessageImage: createImageUpload("messages", "message"),
};
