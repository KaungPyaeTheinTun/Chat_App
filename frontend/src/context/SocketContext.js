import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import socketService from "../services/socketService";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      socketService.disconnect();
      setIsConnected(false);
      return undefined;
    }

    const socket = socketService.connect(token);
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [token]);

  const value = useMemo(
    () => ({
      socket: socketService.socket,
      isConnected,
      on: (event, callback) => socketService.on(event, callback),
      off: (event, callback) => socketService.off(event, callback),
      emit: (event, payload, callback) =>
        socketService.emit(event, payload, callback),
    }),
    [isConnected],
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider.");
  }

  return context;
};
