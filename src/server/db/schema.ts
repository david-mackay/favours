import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletAddress: text("wallet_address").notNull(),
    displayName: text("display_name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    walletAddressIdx: uniqueIndex("users_wallet_address_unique").on(
      table.walletAddress
    ),
  })
);

// ── Auth Nonces ─────────────────────────────────────────────────────────────
export const authNonces = pgTable(
  "auth_nonces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletAddress: text("wallet_address").notNull(),
    nonce: text("nonce").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    walletIdx: index("auth_nonces_wallet_idx").on(table.walletAddress),
    nonceUnique: uniqueIndex("auth_nonces_nonce_unique").on(table.nonce),
  })
);

// ── Favours (Bounties) ─────────────────────────────────────────────────────
export const favours = pgTable(
  "favours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorWallet: text("creator_wallet").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    bountyAmount: numeric("bounty_amount").notNull(),
    bountyToken: text("bounty_token").notNull().default("SOL"),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    claimerWallet: text("claimer_wallet"),
    category: varchar("category", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at"),
    transactionSignature: text("transaction_signature"),
  },
  (table) => ({
    creatorWalletIdx: index("favours_creator_wallet_idx").on(
      table.creatorWallet
    ),
    claimerWalletIdx: index("favours_claimer_wallet_idx").on(
      table.claimerWallet
    ),
    statusIdx: index("favours_status_idx").on(table.status),
    createdAtIdx: index("favours_created_at_idx").on(table.createdAt),
  })
);

// ── Friendships ─────────────────────────────────────────────────────────────
export const friendships = pgTable(
  "friendships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId1: uuid("user_id_1").notNull(),
    userId2: uuid("user_id_2").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    friendshipUnique: uniqueIndex("friendships_unique").on(
      table.userId1,
      table.userId2
    ),
    user1Idx: index("friendships_user1_idx").on(table.userId1),
    user2Idx: index("friendships_user2_idx").on(table.userId2),
  })
);

// ── Messages ────────────────────────────────────────────────────────────────
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id").notNull(),
    receiverId: uuid("receiver_id").notNull(),
    content: text("content"),
    type: varchar("type", { length: 20 }).notNull().default("text"),
    mediaUrl: text("media_url"),
    amount: numeric("amount"),
    transactionHash: text("transaction_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isRead: boolean("is_read").default(false),
  },
  (table) => ({
    senderIdx: index("messages_sender_idx").on(table.senderId),
    receiverIdx: index("messages_receiver_idx").on(table.receiverId),
  })
);

// ── Relations ───────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  friendships1: many(friendships, { relationName: "friendships_user1" }),
  friendships2: many(friendships, { relationName: "friendships_user2" }),
  sentMessages: many(messages, { relationName: "messages_sender" }),
  receivedMessages: many(messages, { relationName: "messages_receiver" }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user1: one(users, {
    fields: [friendships.userId1],
    references: [users.id],
    relationName: "friendships_user1",
  }),
  user2: one(users, {
    fields: [friendships.userId2],
    references: [users.id],
    relationName: "friendships_user2",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "messages_sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "messages_receiver",
  }),
}));

// ── Types ───────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Favour = typeof favours.$inferSelect;
export type NewFavour = typeof favours.$inferInsert;
export type Message = typeof messages.$inferSelect;
