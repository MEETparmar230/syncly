export type Message = {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  delivered: boolean;
  seen: boolean;
};

