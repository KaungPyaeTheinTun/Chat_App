import axios from "axios";

const RAW_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000";
const API_BASE_URL = RAW_API_BASE_URL.endsWith("/api/v1")
  ? RAW_API_BASE_URL
  : `${RAW_API_BASE_URL}/api/v1`;

let accessToken = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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

export const createClientMessageId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
  registerDeviceToken: async (payload) =>
    unwrap(await api.post("/users/device-tokens", payload)),
  status: async (userId) =>
    (await api.get(`/users/status/${userId}`)).data.data,
};

export const conversationsApi = {
  list: async (params = {}) =>
    (await api.get("/conversations", { params })).data.data.conversations,
  createDirect: async (userId) =>
    (await api.post("/conversations/direct", { userId })).data.data
      .conversation,
  createGroup: async ({ title, memberIds }) =>
    (await api.post("/conversations/group", { title, memberIds })).data.data
      .conversation,
  updatePreferences: async (conversationId, payload) =>
    unwrap(
      await api.patch(`/conversations/${conversationId}/preferences`, payload),
    ),
  updateGroupProfile: async (conversationId, payload) =>
    (await api.patch(`/conversations/${conversationId}/group`, payload)).data
      .data.conversation,
  uploadGroupAvatar: async (conversationId, asset) => {
    const formData = buildImageFormData("avatar", asset, "group");
    return (
      await api.post(`/conversations/${conversationId}/group/avatar`, formData)
    ).data.data.conversation;
  },
  addMembers: async (conversationId, memberIds) =>
    (await api.post(`/conversations/${conversationId}/members`, { memberIds }))
      .data.data.conversation,
  removeMember: async (conversationId, memberId) =>
    (await api.delete(`/conversations/${conversationId}/members/${memberId}`))
      .data.data.conversation,
  leave: async (conversationId) =>
    unwrap(await api.post(`/conversations/${conversationId}/leave`)),
};

export const messagesApi = {
  list: async (conversationId, params = {}) =>
    unwrap(
      await api.get(`/messages/conversation/${conversationId}`, { params }),
    ),
  send: async (payload) => unwrap(await api.post("/messages", payload)),
  sendImage: async ({ receiverId, conversationId, asset, clientMessageId }) => {
    const formData = buildImageFormData("image", asset, "message");
    if (receiverId) {
      formData.append("receiverId", String(receiverId));
    }
    if (conversationId) {
      formData.append("conversationId", String(conversationId));
    }
    if (clientMessageId) {
      formData.append("clientMessageId", clientMessageId);
    }
    return unwrap(await api.post("/messages/image", formData));
  },
  edit: async (messageId, payload) =>
    unwrap(await api.patch(`/messages/${messageId}`, payload)),
  remove: async (messageId) =>
    unwrap(await api.delete(`/messages/${messageId}`)),
  search: async (query) =>
    (await api.get("/messages/search", { params: { q: query } })).data.data
      .messages,
  markDelivered: async (conversationId) =>
    unwrap(
      await api.post(`/messages/conversation/${conversationId}/delivered`),
    ),
  markRead: async (conversationId) =>
    unwrap(await api.post(`/messages/conversation/${conversationId}/read`)),
};

export default api;
