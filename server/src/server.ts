import "dotenv/config";
import http from "http";
import app from "./app";
import { Server } from "socket.io";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "./redis";
import db from "./db";
import { messagesTable } from "./db/schema";
import { eq, ne, and, inArray } from "drizzle-orm";


const frontEnd = process.env.FRONT_END!


const JWT_SECRET = process.env.JWT_SECRET!;
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [frontEnd,"http://localhost:3000"],
    credentials: true,
  },
});

const userSockets = new Map<number, Set<string>>();

// Authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("❌ No token provided");
      return next(new Error("Unauthorized - No token"));
    }
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      userId: number;
    };
    if (!decoded.userId) {
      return next(new Error("Unauthorized - Invalid token"));
    }
    socket.data.userId = decoded.userId;
    console.log("✅ Socket authenticated for user:", decoded.userId);
    next();
  } catch (err) {
    console.log("❌ Authentication error:", err);
    return next(new Error("Authentication failed"));
  }
});

io.on("connection", async (socket) => {
  const userId = socket.data.userId;
  console.log("👤 User Connected:", userId);

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  const sockets = userSockets.get(userId);
  sockets?.add(socket.id);

  if (sockets?.size === 1) {
    // First socket for this user → set as online in Redis
    await redis.set(`online:${userId}`, "1", "EX", 120);
    // Broadcast to everyone that this user is online
    io.emit("presence:update", {
      userId,
      online: true,
    });
  }

  // Send current online status to the newly connected client
  // This fixes the refresh issue
  socket.on("request-online-status", async () => {
    try {
      // Get all online keys from Redis
      const onlineKeys = await redis.keys("online:*");
      const onlineUserIds = onlineKeys.map((key) => 
        parseInt(key.replace("online:", ""))
      );

      const onlineStatus: Record<number, boolean> = {};
      for (const id of onlineUserIds) {
        onlineStatus[id] = true;
      }

      socket.emit("online-status-sync", onlineStatus);
    } catch (error) {
      console.error("Error fetching online status:", error);
    }
  });

  // Heartbeat to keep user online status
  const heartbeat = setInterval(async () => {
    await redis.set(`online:${userId}`, "1", "EX", 120);
  }, 30000);

  // Join chat room
  socket.on("join-chat", (chatId: number) => {
    socket.join(`chat:${chatId}`);
    console.log(`📍 User ${userId} joined chat ${chatId}`);
    socket.to(`chat:${chatId}`).emit("user-joined", { userId, chatId });
  });

  // Send message
  socket.on(
    "send-message",
    async ({ chatId, content }: { chatId: number; content: string }) => {
      try {
        const [message] = await db
          .insert(messagesTable)
          .values({
            chatId,
            senderId: userId,
            content,
            delivered: true,
          })
          .returning();
        console.log(`📤 Message ${message?.id} sent to chat ${chatId}`);
        io.to(`chat:${chatId}`).emit("new-message", message);
        socket.emit("message-status-update", {
          messageId: message?.id,
          delivered: true,
        });
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("message-error", { error: "Failed to send message" });
      }
    }
  );

  // User is typing
  socket.on("typing", ({ chatId }: { chatId: number }) => {
    socket.to(`chat:${chatId}`).emit("user-typing", { userId, chatId });
  });

  // User stopped typing
  socket.on("stop-typing", ({ chatId }: { chatId: number }) => {
    socket.to(`chat:${chatId}`).emit("user-stop-typing", { userId, chatId });
  });

  // Message seen
  socket.on(
    "message-seen",
    async ({
      chatId,
      messageIds,
    }: {
      chatId: number;
      messageIds: number[];
    }) => {
      try {
        if (!messageIds || messageIds.length === 0) {
          console.warn("⚠️ No message IDs provided");
          return;
        }
        await db
          .update(messagesTable)
          .set({ seen: true })
          .where(
            and(
              inArray(messagesTable.id, messageIds),
              ne(messagesTable.senderId, userId)
            )
          );
        console.log(
          `✓ User ${userId} marked ${messageIds.length} messages as seen in chat ${chatId}`
        );
        io.to(`chat:${chatId}`).emit("messages-seen-update", {
          chatId,
          messageIds,
          seenBy: userId,
        });
      } catch (error) {
        console.error("❌ Error marking messages as seen:", error);
      }
    }
  );

  // User disconnect
  socket.on("disconnect", async () => {
    clearInterval(heartbeat);
    const sockets = userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(socket.id);

    if (sockets.size === 0) {
      userSockets.delete(userId);
      await redis.del(`online:${userId}`);
      io.emit("presence:update", {
        userId,
        online: false,
      });
    }
    console.log(`👋 User ${userId} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});