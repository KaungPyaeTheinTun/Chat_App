export const isEmail = (value) => /\S+@\S+\.\S+/.test(value);

export const isStrongPassword = (value) =>
  typeof value === "string" && value.length >= 6;

export const isRequired = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const isImageUrl = (value) =>
  /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(String(value || "").trim());
