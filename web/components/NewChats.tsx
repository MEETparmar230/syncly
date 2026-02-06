"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface User {
  id: number;
  name: string;
  email: string;
}

interface NewChatsProps {
  onClose: () => void;
  onChatCreated: () => void;
}

export default function NewChats({ onClose, onChatCreated }: NewChatsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingUserId, setCreatingUserId] = useState<number | null>(null);
  const path = process.env.NEXT_PUBLIC_API!;

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${path}/users`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [path]);

  const handleUserClick = async (userId: number) => {
    setCreatingUserId(userId);
    setCreating(true);
    try {
      const res = await axios.post(
        `${path}/chats/one-to-one`,
        { otherUserId: userId },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success("Chat created!");
        // Call the callback to refresh chat list
        onChatCreated();
        onClose();
      } else {
        toast.error("Unable to create chat");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to create chat");
      } else {
        toast.error("Error creating chat");
      }
    } finally {
      setCreating(false);
      setCreatingUserId(null);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur text-blue-500  flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-blue-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        <h2 className="text-xl font-bold mb-4">Start New Chat</h2>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No users available</p>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                disabled={creating && creatingUserId === user.id}
                className={`w-full text-left p-3 border rounded transition ${
                  creating && creatingUserId === user.id
                    ? "bg-zinc-600 text-zinc-100 border-gray-300 cursor-not-allowed opacity-75"
                    : "border-gray-200  hover:bg-zinc-800 text-zinc-200 hover:text-zinc-200  hover:border-blue-300 cursor-pointer"
                }`}
              >
                <div className=" flex items-center justify-between">
                  <div>
                    <div className="font-semibold ">
                      {user.name}
                    </div>
                    <div className="text-xs ">{user.email}</div>
                  </div>
                  {creating && creatingUserId === user.id && (
                    <span className="text-xs text-blue-500 animate-pulse">
                      Creating...
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}