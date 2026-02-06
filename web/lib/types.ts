export type Message = {
    id: number;
    chatId: number;
    senderId: number;
    content: string;
    createdAt: string;
    delivered: boolean;
    seen: boolean;
  };
