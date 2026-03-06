import { createContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { io, Socket } from "socket.io-client";

export const SocketContext = createContext<any>(null);

const SocketProvider = ({ children }: { children: ReactNode }) => {
  const SOCKET_URL = "http://localhost:5000/socket";
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[] | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (token && !socket) {
      const mySocket = io(SOCKET_URL, {
        autoConnect: false,
        auth: {
          token,
        },
      });

      setSocket(mySocket);
    }
  }, [token]);

  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log("Connected with token!");
      });

      socket.on("connect_error", (err) => {
        console.error("Connection error:", err.message); // Handle authentication errors
      });

      socket.on("disconnect", () => {
        setSocket(null);
        setToken(null);
        setUser(null);
        setUsers(null);
        // toast.error("Socket disconnected!");
      });
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        setSocket,
        token,
        setToken,
        user,
        setUser,
        users,
        setUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
