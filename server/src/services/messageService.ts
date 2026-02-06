import { and, desc, eq } from "drizzle-orm";
import db from "../db";
import { chatMembersTable, messagesTable } from "../db/schema";

async function isChatMember(chatId: number, userId: number) {
  const member = await db
    .select()
    .from(chatMembersTable)
    .where(
      and(
        eq(chatMembersTable.chatId, chatId),
        eq(chatMembersTable.userId, userId)
      )
    );
  return member.length > 0;
}

export async function sendMessage(
  chatId: number,
  senderId: number,
  content: string
) {
  const allowed = await isChatMember(chatId, senderId);
  if (!allowed) throw new Error("Not a chat Member");

  const [message] = await db
    .insert(messagesTable)
    .values({ chatId, senderId, content })
    .returning();

  return message;
}

export async function getMessages(
  chatId: number,
  userId: number,
  limit: number = 20
) {
  limit = Number(limit);
  const allowed = await isChatMember(chatId, userId);
  if (!allowed) throw new Error("Not authorized");

  // ✅ AWAIT the query
  return await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.chatId, chatId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);
}