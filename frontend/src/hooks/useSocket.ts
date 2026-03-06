import { useContext } from "react";
import { SocketContext } from "../store/SocketProvider";

const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) throw new Error("Socket not found!");

  return context;
};

export default useSocket;
