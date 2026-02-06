"use client";
import { useCallback, useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import axios from "axios";
import toast from "react-hot-toast";
import { Message } from "@/lib/types";

type OnlineMap = Record<number, boolean>;

interface Chat {
  chatId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserEmail: string;
  unread: number;
  online?: boolean | null;
}

interface ChatListProps {
  selectedChatId: number | null;
  onSelectChat: (
    chatId: number,
    otherUserName: string,
    otherUserEmail: string,
    otherUserId: number
  ) => void;
  refreshTrigger: number;
}

export default function ChatList({
  selectedChatId,
  onSelectChat,
  refreshTrigger,
}: ChatListProps) {

  const [chats, setChats] = useState<Chat[]>([]);
  const [onlineMap, setOnlineMap] = useState<OnlineMap>({});
  const [loading, setLoading] = useState(true);
  const path = process.env.NEXT_PUBLIC_API!;

  // Load chats
   useEffect(() => {
    const loadChats = async () => {
      try {
          const res = await axios.get(`${path}/chats`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setChats(res.data.chats);
        } else {
          toast.error("Failed to fetch Chats");
        }
      } catch (err) {
        console.log(err);
        if (axios.isAxiosError(err)) {
          toast.error(err.response?.data?.message || "Not Authenticated");
        } else {
          toast.error("Something Went Wrong while fetching Chats");
        }
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [path, refreshTrigger]);

  // Sync online status on connection and listen for updates
  useEffect(() => {
    const handlePresenceUpdate = ({
      userId,
      online,
    }: {
      userId: number;
      online: boolean;
    }) => {
      setOnlineMap((prev) => ({
        ...prev,
        [userId]: online,
      }));
    };

    const handleStatusSync = (onlineStatus: Record<number, boolean>) => {
      setOnlineMap(onlineStatus);
    };

    // Request current online status when socket connects
    socket.emit("request-online-status");
    socket.on("online-status-sync", handleStatusSync);
    socket.on("presence:update", handlePresenceUpdate);

    return () => {
      socket.off("online-status-sync", handleStatusSync);
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, []);

  // Listen for new messages to update unread count
  useEffect(() => {
  const handleNewMessage = (msg: Message) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === msg.chatId && msg.senderId === chat.otherUserId
          ? { ...chat, unread: chat.unread + 1 }
          : chat
      )
    );
  };

  const handleMessagesSeen = ({ chatId }: { chatId: number }) => {
    // ✅ Set to 0 when messages are seen
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === chatId ? { ...chat, unread: 0 } : chat
      )
    );
  };

  socket.on("new-message", handleNewMessage);
  socket.on("messages-seen-update", handleMessagesSeen);

  return () => {
    socket.off("new-message", handleNewMessage);
    socket.off("messages-seen-update", handleMessagesSeen);
  };
}, []);

  useEffect(() => {
  if (!socket.connected) return;

  // Emit on connection
  socket.emit("request-online-status");

  // Re-emit if socket reconnects
  const handleConnect = () => {
    console.log("📍 Socket reconnected, requesting online status");
    socket.emit("request-online-status");
  };

  socket.on("connect", handleConnect);

  return () => {
    socket.off("connect", handleConnect);
  };
}, [socket.connected])

// When user clicks a chat, reset its unread count
const handleSelectChat = useCallback(
  (
    chatId: number,
    otherUserName: string,
    otherUserEmail: string,
    otherUserId: number
  ) => {
    // ✅ Reset unread count immediately
    setChats((prev) =>
      prev.map((chat) =>
        chat.chatId === chatId
          ? { ...chat, unread: 0 }
          : chat
      )
    );

    // Then call parent's onSelectChat
    onSelectChat(chatId, otherUserName, otherUserEmail, otherUserId);
  },
  [onSelectChat]
);

 if (loading) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-full flex items-center gap-3 p-3 rounded bg-zinc-800 "
        >
          {/* Avatar Skeleton */}
          <div className="relative flex-shrink-0 animate-pulse">
            <div className="w-12 h-12 bg-zinc-500 rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-zinc-500 rounded-full border-2 border-zinc-800"></div>
          </div>

          {/* Text Skeleton */}
          <div className="flex-1 space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-zinc-500 rounded"></div>
            <div className="h-3 w-20 bg-zinc-600 rounded"></div>
          </div>

          {/* Unread Badge Skeleton */}
          <div className="h-5 w-6 bg-zinc-500 rounded-full animate-pulse"></div>
        </div>
      ))}
    </div>
  )
}


  return (
    <div className="space-y-1 p-2">
      {chats.length === 0 ? (
        <p className="p-4 text-zinc-200 text-center">No chats yet</p>
      ) : (
        chats.map((chat) => (
          <button
            key={chat.chatId}
            onClick={() =>
              handleSelectChat(
                chat.chatId,
                chat.otherUserName,
                chat.otherUserEmail,
                chat.otherUserId
              )
            }
            className={`w-full flex items-center gap-3 p-3 rounded transition cursor-pointer ${
              selectedChatId === chat.chatId
                ? "bg-blue-100 border-l-4 border-blue-500"
                : "hover:bg-blue-100 bg-blue-200 "
            }`}
          >
            {/* Avatar with initials */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {chat.otherUserName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              {onlineMap[chat.otherUserId] && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            {/* Chat Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-gray-900 truncate">
                {chat.otherUserName}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {onlineMap[chat.otherUserId] && (
                  <p className="text-green-500">online</p>
                )}
              </div>
            </div>
            {/* Unread Badge */}
            {chat.unread > 0 && (
              <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0 min-w-max">
                {chat.unread > 99 ? "99+" : chat.unread}
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );
}