const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";

const API_ORIGIN = RAW_API_BASE_URL.replace(/\/api\/v1$/, "");

export const resolveMediaUrl = (value) => {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("file://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }

  return `${API_ORIGIN}/${value}`;
};
