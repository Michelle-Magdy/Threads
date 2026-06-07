"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type UseSocketResult = {
  socket: Socket | null;
  connected: boolean;
};

export function useSocket(): UseSocketResult {
  const { userId, isLoaded } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function fn() {
      if (!isLoaded) return;
      // if user is not authenticated it must be disconnected
      if (!userId) {
        setConnected(false);
        setSocket((prev) => {
          if (prev) {
            prev.disconnect();
          }
          return null;
        });

        return;
      }

      const baseUrl = "http://localhost:5000";
      console.log(`[socket], ${baseUrl} , ${userId}`);

      const socketInstance: Socket = io(baseUrl, {
        auth: { userId }, // backend is going to read the userId
        withCredentials: true,
        transports: ["websocket"],
      });
      setSocket(socketInstance);

      const handleConnect = () => {
        console.log(`[connect socket], ${baseUrl} , ${userId}`);
        setConnected(true);
      };

      const handleDisconnect = (reason: unknown) => {
        console.log(
          `[disconnect socket], ${baseUrl} , ${userId} , reason: ${reason}`,
        );
        setConnected(false);
      };

      const handleConnectError = (err: unknown) => {
        console.log(err);
      };

      socketInstance.on("connect", handleConnect);
      socketInstance.on("disconnect", handleDisconnect);
      socketInstance.on("connect_error", handleConnectError);

      return () => {
        socketInstance.off("connect", handleConnect);
        socketInstance.off("disconnect", handleDisconnect);
        socketInstance.off("connect_error", handleConnectError);
        setConnected(false);
        setSocket(null);
      };
    }
    fn();
  }, [userId, isLoaded]);

  return { socket, connected };
}
