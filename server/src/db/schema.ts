import { pgTable, serial, varchar, timestamp, primaryKey, index,  boolean, integer } from "drizzle-orm/pg-core";


export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



export const chatsTable = pgTable("chats", {
  id: serial("id").primaryKey(),
  isGroup: boolean("is_group").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



export const chatMembersTable = pgTable(
  "chat_members",
  {
    chatId: integer("chat_id")
      .notNull()
      .references(() => chatsTable.id, { onDelete: "cascade" }),

    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chatId, table.userId] }),
    index("chat_members_chat_idx").on(table.chatId),
    index("chat_members_user_idx").on(table.userId),
  ]
);



export const messagesTable = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),

    chatId: integer("chat_id")
      .notNull()
      .references(() => chatsTable.id, { onDelete: "cascade" }),

    senderId: integer("sender_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    content: varchar("content", { length: 2000 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    delivered: boolean("delivered").default(false),

    seen: boolean("seen").default(false).notNull(),
  },
  (table) => [
    index("messages_chat_idx").on(table.chatId),
    index("messages_sender_idx").on(table.senderId),
  ]
);