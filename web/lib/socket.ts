import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";



export const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  withCredentials: true,
  autoConnect: false,

});

socket.on("connect", () => {
  console.log("✅ Socket connected");
});

socket.on("connect_error", (error) => {
  console.log("❌ Socket connection error:", error);
});

socket.on("disconnect", () => {
  console.log("❌ Socket disconnected");
});