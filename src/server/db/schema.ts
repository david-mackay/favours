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
    visibility: varchar("visibility", { length: 20 }).notNull().default("public"),
    allowedViewers: text("allowed_viewers"),
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

// ── Messages ────────────────────────────────────────────────────────────────
// Uses wallet addresses directly — profile data (display name, avatar)
// is fetched from Tapestry at the application layer, not stored here.
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderWallet: text("sender_wallet").notNull(),
    receiverWallet: text("receiver_wallet").notNull(),
    content: text("content"),
    type: varchar("type", { length: 20 }).notNull().default("text"),
    mediaUrl: text("media_url"),
    amount: numeric("amount"),
    transactionHash: text("transaction_hash"),
    mintAddress: text("mint_address"),
    tokenSymbol: varchar("token_symbol", { length: 20 }),
    tokenName: text("token_name"),
    nftName: text("nft_name"),
    favourId: uuid("favour_id"),
    isOpened: boolean("is_opened").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    isRead: boolean("is_read").default(false),
  },
  (table) => ({
    senderIdx: index("messages_sender_idx").on(table.senderWallet),
    receiverIdx: index("messages_receiver_idx").on(table.receiverWallet),
  })
);

// ── Gacha NFT Pool ──────────────────────────────────────────────────────────
export const gachaNfts = pgTable(
  "gacha_nfts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mintAddress: text("mint_address").notNull(),
    name: text("name").notNull(),
    imageUrl: text("image_url").notNull(),
    rarity: varchar("rarity", { length: 20 }).notNull().default("common"),
    isClaimed: boolean("is_claimed").default(false),
    claimedByWallet: text("claimed_by_wallet"),
    claimedAt: timestamp("claimed_at"),
    messageId: uuid("message_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    mintAddressIdx: uniqueIndex("gacha_nfts_mint_address_unique").on(
      table.mintAddress
    ),
    rarityIdx: index("gacha_nfts_rarity_idx").on(table.rarity),
    isClaimedIdx: index("gacha_nfts_is_claimed_idx").on(table.isClaimed),
  })
);

// ── Types ───────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type Favour = typeof favours.$inferSelect;
export type NewFavour = typeof favours.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type GachaNft = typeof gachaNfts.$inferSelect;
