import axios from "axios";

const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE_URL.endsWith("/api/v1")
  ? RAW_API_BASE_URL
  : `${RAW_API_BASE_URL}/api/v1`;

let accessToken = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

const unwrap = (response) => response.data?.data;

const inferMimeType = (asset) => {
  if (asset.mimeType?.startsWith("image/")) {
    return asset.mimeType;
  }

  const extension = asset.fileName?.split(".").pop()?.toLowerCase();

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
};

const buildImageFormData = (fieldName, asset, fallbackFileName) => {
  const extension = asset.fileName?.split(".").pop() || "jpg";
  const formData = new FormData();
  formData.append(fieldName, {
    uri: asset.uri,
    name: asset.fileName || `${fallbackFileName}.${extension}`,
    type: inferMimeType(asset),
  });
  return formData;
};

export const setApiToken = (token) => {
  accessToken = token;
};

export const authApi = {
  register: async (payload) =>
    unwrap(await api.post("/auth/register", payload)),
  login: async (payload) => unwrap(await api.post("/auth/login", payload)),
  refresh: async (payload) => unwrap(await api.post("/auth/refresh", payload)),
  logout: async () => unwrap(await api.post("/auth/logout")),
  verify: async () => unwrap(await api.get("/auth/verify")),
};

export const usersApi = {
  list: async () => (await api.get("/users")).data.data.users,
  profile: async (userId) => (await api.get(`/users/${userId}`)).data.data.user,
  update: async (userId, payload) =>
    (await api.put(`/users/${userId}`, payload)).data.data.user,
  uploadAvatar: async (userId, asset) => {
    const formData = buildImageFormData("avatar", asset, "avatar");
    return (await api.post(`/users/${userId}/avatar`, formData)).data.data.user;
  },
  status: async (userId) =>
    (await api.get(`/users/status/${userId}`)).data.data,
};

export const conversationsApi = {
  list: async () => (await api.get("/conversations")).data.data.conversations,
};

export const messagesApi = {
  list: async (conversationId, params = {}) =>
    (await api.get(`/messages/conversation/${conversationId}`, { params })).data
      .data.messages,
  send: async (payload) => (await api.post("/messages", payload)).data.data,
  sendImage: async (receiverId, asset) => {
    const formData = buildImageFormData("image", asset, "message");
    formData.append("receiverId", String(receiverId));
    return (await api.post("/messages/image", formData)).data.data;
  },
  edit: async (messageId, payload) =>
    (await api.patch(`/messages/${messageId}`, payload)).data.data,
  remove: async (messageId) =>
    (await api.delete(`/messages/${messageId}`)).data.data,
  search: async (query) =>
    (await api.get("/messages/search", { params: { q: query } })).data.data
      .messages,
  markRead: async (conversationId) =>
    (await api.post(`/messages/conversation/${conversationId}/read`)).data.data,
};

export default api;
