import { Request, Response } from "express";
import { redis } from "../redis";
import { usersTable } from "../db/schema";
import db from "../db";
import { eq, ne } from "drizzle-orm";

export async function getUserStatus(req: Request, res: Response) {
  const userId = Number(req.params.userId);

  try {
    const isOnline = await redis.exists(`online:${userId}`);
    res.json({ success: true, online: Boolean(isOnline) });
  } catch (e) {
    console.error("Redis error:", e);
    res.json({ success: true, online: false }); 
  }
}


export async function getAllUsers(
  req: Request & { userId?: number },
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch all users except the current user
    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(ne(usersTable.id, req.userId));

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function getUser(
  req: Request,
  res: Response
) {
  try {
    const userId = Number(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      user: user[0],
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
}
