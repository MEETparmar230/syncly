"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { socket } from "@/lib/socket";
import toast from "react-hot-toast";
import { useAuthContex } from "@/lib/auth-context";


type Message = {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
  delivered: boolean;
  seen: boolean;
};

interface SelectedChat {
  chatId: number;
  otherUserName: string;
  otherUserEmail: string;
  otherUserId: number;
}

interface ChatPageProps {
  selectedChat: SelectedChat | null;
}

export default function ChatPage({ selectedChat }: ChatPageProps) {
  const path = process.env.NEXT_PUBLIC_API!;
  const { user, loading: authLoading } = useAuthContex();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log(`🔔 Notification permission: ${permission}`);
      });
    }
  }, []);

  // Monitor socket connection
  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
      if (selectedChat?.chatId) {
        socket.emit("join-chat", selectedChat.chatId);
        console.log(`📍 Joined chat: ${selectedChat.chatId}`);
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log(`🔴 Socket disconnected: ${reason}`);
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      setIsConnected(true);
      if (selectedChat?.chatId) {
        socket.emit("join-chat", selectedChat.chatId);
      }
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [selectedChat?.chatId]);

  // Check other user's online status
useEffect(() => {
  if (!selectedChat?.otherUserId) return;

  const handlePresence = ({ userId, online }: { userId: number; online: boolean }) => {
    if (userId === selectedChat.otherUserId) {
      setOtherUserOnline(online);
    }
  };

  socket.on("presence:update", handlePresence);

  return () => {
    socket.off("presence:update", handlePresence);
  };
}, [selectedChat?.otherUserId]);

  // Load messages when chatId changes
  useEffect(() => {
    if (!selectedChat?.chatId) {
      setLoading(false);
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${path}/messages/${selectedChat.chatId}`,
          { withCredentials: true }
        );
        if (res.data.success) {
          setMessages(res.data.messages || []);
          console.log(`✅ Loaded ${res.data.messages?.length || 0} messages`);
        }
      } catch (err) {
        console.error("❌ Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedChat?.chatId, path]);

  // Auto-mark messages as seen when viewing
  useEffect(() => {
    if (!selectedChat?.chatId || !user?.id || messages.length === 0) return;

    // Get unread messages from other user
    const unreadMessages = messages.filter(
      (m) => m.senderId !== user.id && !m.seen
    );

    if (unreadMessages.length === 0) return;

    // Wait 500ms before marking as seen (visual feedback)
    const timer = setTimeout(() => {
      console.log(`📤 Marking ${unreadMessages.length} messages as seen`);
      socket.emit("message-seen", {
        chatId: selectedChat.chatId,
        messageIds: unreadMessages.map((m) => m.id),
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [messages, selectedChat?.chatId, user?.id]);

  // Setup socket listeners
  useEffect(() => {
    const handleNewMessage = (msg: Message) => {
      console.log("📨 New message received:", msg.id);
      setMessages((prev) => [...prev, msg]);

      // Show notification if message is from other user
      if (msg.senderId !== user?.id) {
        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Message from ${selectedChat?.otherUserName}`, {
            body: msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : ""),
            tag: `chat-${selectedChat?.chatId}`,
            icon: "/notification-icon.png",
          });
        }

        // Toast notification
        toast.success(
          `${selectedChat?.otherUserName}: ${msg.content.substring(0, 40)}`,
          { duration: 4 }
        );
      }
    };

    // Handle specific messages marked as seen
    const handleMessagesSeen = ({ messageIds }: { messageIds: number[] }) => {
      console.log(`✓ Messages seen:`, messageIds);
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id) ? { ...m, seen: true } : m
        )
      );
    };

    const handleUserTyping = ({ userId }: { userId: number }) => {
      console.log(`👤 User ${userId} is typing`);
      setTypingUsers((prev) => new Set(prev).add(userId));
    };

    const handleUserStopTyping = ({ userId }: { userId: number }) => {
      console.log(`👤 User ${userId} stopped typing`);
      setTypingUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    socket.on("new-message", handleNewMessage);
    socket.on("messages-seen-update", handleMessagesSeen);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("messages-seen-update", handleMessagesSeen);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
    };
  }, [user?.id, selectedChat]);

  const handleTyping = useCallback(
    (value: string) => {
      setText(value);

      if (socket.connected && selectedChat?.chatId) {
        socket.emit("typing", { chatId: selectedChat.chatId });
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socket.connected && selectedChat?.chatId) {
          socket.emit("stop-typing", { chatId: selectedChat.chatId });
        }
      }, 1500);
    },
    [selectedChat?.chatId]
  );

  const sendMessage = useCallback(() => {
    if (!text.trim()) {
      console.warn("⚠️ Empty message");
      return;
    }

    if (!socket.connected) {
      console.error("❌ Socket not connected!");
      toast.error("Connection lost. Please try again.");
      return;
    }

    if (!selectedChat?.chatId) {
      console.error("❌ No chat ID");
      return;
    }

    console.log(`📤 Sending message to chat ${selectedChat.chatId}`);

    socket.emit("send-message", {
      chatId: selectedChat.chatId,
      content: text.trim(),
    });

    setText("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [text, selectedChat?.chatId]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900">
        <p className="text-gray-300">Loading user...</p>
      </div>
    );
  }

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-zinc-900 to-zinc-500">
        <img src="/logo.png" alt="Syncly Logo" className="w-3xl h-3xl" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 bg-zinc-900 ">
      {/* Header Skeleton */}
      <div className="mb-4 pb-4 border-b border-zinc-700 flex justify-between items-center animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-zinc-700 rounded"></div>
          <div className="h-3 w-24 bg-zinc-800 rounded"></div>
        </div>

        <div className="h-3 w-44 bg-zinc-800 rounded"></div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto mb-4 bg-zinc-800 rounded p-4 space-y-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`max-w-sm ${
              i % 2 === 0 ? "me-auto" : "ms-auto"
            }`}
          >
            {/* Time */}
            <div className="h-2 w-12 bg-zinc-700 rounded mb-1 ms-auto"></div>

            {/* Message bubble */}
            <div
              className={`h-10 rounded ${
                i % 2 === 0
                  ? "bg-zinc-700"
                  : "bg-blue-700/50"
              }`}
            ></div>
          </div>
        ))}
      </div>

      {/* Input Skeleton */}
      <div className="flex gap-2 animate-pulse">
        <div className="flex-1 h-10 bg-zinc-800 rounded"></div>
        <div className="w-20 h-10 bg-blue-900 rounded"></div>
      </div>
    </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 bg-zinc-900">
      {/* Header */}
      <div className="mb-4 pb-4 border-b flex justify-between items-center">
        <div>
          <h2 className="text-xl text-zinc-200 font-bold">
            {selectedChat.otherUserName}
          </h2>

        </div>
        <div className="text-right">

          <p className="text-xs text-zinc-300">{selectedChat.otherUserEmail}</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 border overflow-y-auto mb-4 bg-zinc-800 rounded p-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet</p>
        ) : (
          <>
          <div className="w-full">
            {messages.map((m) => (
              <div key={m.id} className={`mb-3 w-fit ${m.senderId === user.id ? "ms-auto" : "me-auto" }`}>
                <div className="flex justify-between items-start mb-1">
                  
                  <span className="text-xs text-gray-400 ms-auto">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className={`${m.senderId === user.id ? "bg-blue-700" : "bg-zinc-700"} px-2 py-1 rounded shadow-sm max-w-sm break-words whitespace-pre-wrap `}>
                  <p className="text-white">{m.content}</p>
                </div>
                <div className="text-xs w-fit ms-auto text-gray-500 mt-1">

                 {m.senderId === user.id &&(m.seen && "✓")}
                 {m.senderId === user.id &&(m.delivered && "✓")}
                  
                </div>
              </div>
            ))}
            </div>
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="p-3 text-sm text-gray-500 italic animate-pulse">
            {typingUsers.size === 1
              ? `${selectedChat.otherUserName} is typing...`
              : `${typingUsers.size} people are typing...`}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          className="border text-white bg-zinc-800 flex-1 p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="Type message..."
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={!isConnected}
        />
        <button
          className={`px-4 py-2 text-white rounded font-medium ${
            isConnected && text.trim()
              ? "bg-blue-600 hover:bg-blue-600 cursor-pointer"
              : "bg-blue-900 cursor-not-allowed"
          }`}
          onClick={sendMessage}
          disabled={!isConnected || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}