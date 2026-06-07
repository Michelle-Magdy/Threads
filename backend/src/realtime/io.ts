import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";
import { getUserFromClerk } from "../modules/users/user.service.js";
let io: Server | null = null;

// stored in in-memroy map for performance but if you want to scale you should migrate to redis in memory database
const onlineUsers = new Map<number, Set<string>>();

function addOnlineUser(rawUserId: unknown, socketId: string) {
  const userId = Number(rawUserId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return;
  }
  const existing = onlineUsers.get(userId);
  if (existing) {
    existing.add(socketId);
  } else {
    onlineUsers.set(userId, new Set([socketId]));
  }
}

function removeOnlineUser(rawUserId: unknown, socketId: string) {
  const userId = Number(rawUserId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return;
  }

  const existing = onlineUsers.get(userId);

  if (!existing) return;
  existing.delete(socketId);
  if (existing.size === 0) {
    onlineUsers.delete(userId);
  }
}

function broadcastPresence() {
  io?.emit("presence:update", {
    onlineUsersIds: getOnlineUsersIds(),
  });
}

function getOnlineUsersIds(): number[] {
  return Array.from(onlineUsers.keys());
}

export function initIO(httpServer: HttpServer) {
  if (io) return io; // singleton pattern
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const clerkUserId = socket.handshake.auth?.userId;
      if (!clerkUserId || typeof clerkUserId !== "string") {
        console.log("missing clerk user id");
        socket.disconnect(true);
        return;
      }

      const profile = await getUserFromClerk(clerkUserId);
      const userId = Number(profile.user.id);
      if (!userId || !Number.isFinite(userId) || userId <= 0) {
        console.log("invalid user id");
        socket.disconnect(true);
        return;
      }

      (socket.data as { userId: number }) = {
        userId: userId,
      };

      next();
    } catch (err) {
      console.log("Error in socket io auth middleware", err);
      next(new Error("Internal authentication server error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`[io connection]--------> ${socket.id}`);
    const userId = socket.data.userId;
    if (!userId) return;
    const notiRoom = `notifications:user:${userId}`;
    socket.join(notiRoom);
    addOnlineUser(userId, socket.id);

    broadcastPresence();

    socket.on('disconnect',()=>{
        console.log(`[io disconnect] user ${userId} diconnected on socket ${socket.id}`);
        removeOnlineUser(userId,socket.id);
        broadcastPresence();
    })
  });
}

export function getIO() {
  return io;
}
