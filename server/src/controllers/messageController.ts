import { Request, Response } from "express";
import db from "../db";
import { messagesTable } from "../db/schema";
import { eq } from "drizzle-orm";

export async function send(
  req: Request & { userId?: number },
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { chatId, content } = req.body;

    // Validation
    if (!chatId || !content) {
      return res
        .status(400)
        .json({ message: "chatId and content are required" });
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ message: "Message content cannot be empty" });
    }

    // Save message to database
    const [message] = await db
      .insert(messagesTable)
      .values({
        chatId,
        senderId: req.userId,
        content: content.trim(),
        delivered: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
}

export async function fetch(
  req: Request & { userId?: number },
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    // Fetch all messages for the chat, ordered by creation time
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, Number(chatId)))
      .orderBy((t) => t.createdAt);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
}