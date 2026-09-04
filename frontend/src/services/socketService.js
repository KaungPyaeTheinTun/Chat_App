import { io } from "socket.io-client";

const RAW_SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_IO_URL || "http://localhost:5000";
const SOCKET_URL = RAW_SOCKET_URL.replace(/\/api\/v1$/, "");

class SocketService {
  socket = null;

  connect(token) {
    if (this.socket) {
      this.socket.auth = { token };

      if (!this.socket.connected) {
        this.socket.connect();
      }

      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: { token },
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event, callback) {
    this.socket?.on(event, callback);
  }

  off(event, callback) {
    this.socket?.off(event, callback);
  }

  emit(event, payload, callback) {
    this.socket?.emit(event, payload, callback);
  }
}

const socketService = new SocketService();
export default socketService;
