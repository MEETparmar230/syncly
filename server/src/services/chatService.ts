import { and, eq, inArray, ne, sql } from "drizzle-orm";
import db from "../db";
import { chatMembersTable, chatsTable, messagesTable, usersTable } from "../db/schema";
import { redis } from "../redis";
import { alias } from "drizzle-orm/pg-core";

export async function createOneToOneChat(
  userId: number,
  otherUserId: number
): Promise<{ chatId: number; isNew: boolean }> {
  if (userId === otherUserId) {
    throw new Error("Cannot create chat with yourself");
  }

  // 1️⃣ Check other user exists
  const otherUserResult = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, otherUserId));

  const otherUser = otherUserResult[0];
  if (!otherUser) {
    throw new Error("User not found");
  }

  // 2️⃣ Check existing chat
  const existingChats = await db
    .select({ chatId: chatMembersTable.chatId })
    .from(chatMembersTable)
    .where(inArray(chatMembersTable.userId, [userId, otherUserId]))
    .groupBy(chatMembersTable.chatId)
    .having(sql`count(*) = 2`);

  if (existingChats.length > 0) {
    const chatId = existingChats[0]?.chatId;
    if (!chatId) {
      throw new Error("Invalid existing chat state");
    }
    return { chatId, isNew: false };
  }

  // 3️⃣ Create new chat - NO TRANSACTION (Neon HTTP doesn't support it)
  const insertedChats = await db
    .insert(chatsTable)
    .values({ isGroup: false })
    .returning({ id: chatsTable.id });

  const chat = insertedChats[0];
  if (!chat) {
    throw new Error("Chat creation failed");
  }

  // Add both users to the chat
  try {
    await db.insert(chatMembersTable).values([
      { chatId: chat.id, userId },
      { chatId: chat.id, userId: otherUserId },
    ]);
  } catch (error) {
    // If members insert fails, the chat is created but empty
    // This is a data consistency issue, but acceptable for HTTP drivers
    console.error("Failed to add members to chat:", error);
    throw new Error("Chat creation failed");
  }

  return { chatId: chat.id, isNew: true };
}

const me = alias(chatMembersTable, "me");
const other = alias(chatMembersTable, "other");

export async function getUserChats(userId: number) {
  const chats = await db
    .select({
      chatId: chatsTable.id,
      isGroup: chatsTable.isGroup,
      otherUserId: other.userId,
      otherUserName: usersTable.name,    
      otherUserEmail: usersTable.email,  
    })
    .from(chatsTable)
    .innerJoin(me, eq(me.chatId, chatsTable.id))
    .innerJoin(other, eq(other.chatId, chatsTable.id))
    .innerJoin(usersTable, eq(usersTable.id, other.userId))  
    .where(
      and(
        eq(chatsTable.isGroup, false),
        eq(me.userId, userId),
        ne(other.userId, userId)
      )
    );

  // ✅ FIX: Calculate unread count from DB
  const chatsWithUnread = await Promise.all(
    chats.map(async (chat) => {
      const unreadResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.chatId, chat.chatId),
            ne(messagesTable.senderId, userId),
            eq(messagesTable.seen, false)
          )
        );
      
      const unreadCount = unreadResult[0]?.count || 0;
      return { ...chat, unread: Number(unreadCount) };
    })
  );

  return chatsWithUnread;
}
