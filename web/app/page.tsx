"use client";
import ChatList from "@/components/ChatList";
import ChatPage from "@/components/ChatPage";
import NewChats from "@/components/NewChats";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";

interface SelectedChat {
  chatId: number;
  otherUserName: string;
  otherUserEmail: string;
  otherUserId: number;
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [chatListRefresh, setChatListRefresh] = useState(0);

  useEffect(() => {
    const handleConnect = () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleChatCreated = () => {
    // Refresh chat list after creating new chat
    setChatListRefresh((prev) => prev + 1);
    setIsNewChatOpen(false);
  };

  const handleSelectChat = (
    chatId: number,
    otherUserName: string,
    otherUserEmail: string,
    otherUserId: number
  ) => {
    setSelectedChat({
      chatId,
      otherUserName,
      otherUserEmail,
      otherUserId,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chat List */}
        <div className="w-80 border-r bg-zinc-900 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="text-white text-2xl font-bold">Chats</h1>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="text-lg px-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold transition"
            >
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatList
              selectedChatId={selectedChat?.chatId || null}
              onSelectChat={handleSelectChat}
              refreshTrigger={chatListRefresh}
            />
          </div>
        </div>

        {/* Right Side - Messages */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPage selectedChat={selectedChat} />
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <NewChats
          onClose={() => setIsNewChatOpen(false)}
          onChatCreated={handleChatCreated}
        />
      )}
    </div>
  );
}