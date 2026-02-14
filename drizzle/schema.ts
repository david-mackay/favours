import { pgTable, uniqueIndex, index, uuid, text, timestamp, foreignKey, varchar, boolean, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const authNonces = pgTable("auth_nonces", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletAddress: text("wallet_address").notNull(),
	nonce: text().notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	uniqueIndex("auth_nonces_nonce_unique").using("btree", table.nonce.asc().nullsLast().op("text_ops")),
	index("auth_nonces_wallet_idx").using("btree", table.walletAddress.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	walletAddress: text("wallet_address").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	displayName: text("display_name"),
	bio: text(),
	avatarUrl: text("avatar_url"),
}, (table) => [
	uniqueIndex("users_wallet_address_unique").using("btree", table.walletAddress.asc().nullsLast().op("text_ops")),
]);

export const friendships = pgTable("friendships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId1: uuid("user_id_1").notNull(),
	userId2: uuid("user_id_2").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("friendships_unique").using("btree", table.userId1.asc().nullsLast().op("uuid_ops"), table.userId2.asc().nullsLast().op("uuid_ops")),
	index("friendships_user1_idx").using("btree", table.userId1.asc().nullsLast().op("uuid_ops")),
	index("friendships_user2_idx").using("btree", table.userId2.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId1],
			foreignColumns: [users.id],
			name: "friendships_user_id_1_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId2],
			foreignColumns: [users.id],
			name: "friendships_user_id_2_users_id_fk"
		}).onDelete("cascade"),
]);

export const invites = pgTable("invites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: text().notNull(),
	creatorId: uuid("creator_id").notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("invites_code_idx").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("invites_creator_idx").using("btree", table.creatorId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "invites_creator_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const reactions = pgTable("reactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	postId: uuid("post_id").notNull(),
	emoji: varchar({ length: 10 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("reactions_post_idx").using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("reactions_user_post_emoji_unique").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.postId.asc().nullsLast().op("text_ops"), table.emoji.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "reactions_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reactions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const posts = pgTable("posts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	content: text(),
	type: varchar({ length: 20 }).default('text').notNull(),
	mediaUrl: text("media_url"),
	vibe: varchar({ length: 50 }),
	eventDate: timestamp("event_date", { mode: 'string' }),
	eventLocation: text("event_location"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	targetUserId: uuid("target_user_id"),
	isFeatured: boolean("is_featured").default(false),
	referencePostId: uuid("reference_post_id"),
}, (table) => [
	index("posts_reference_post_idx").using("btree", table.referencePostId.asc().nullsLast().op("uuid_ops")),
	index("posts_target_user_idx").using("btree", table.targetUserId.asc().nullsLast().op("uuid_ops")),
	index("posts_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [users.id],
			name: "posts_target_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const postStacks = pgTable("post_stacks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	userId: uuid("user_id").notNull(),
	mediaUrl: text("media_url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("post_stacks_post_idx").using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_stacks_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_stacks_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	senderId: uuid("sender_id").notNull(),
	receiverId: uuid("receiver_id").notNull(),
	content: text(),
	type: varchar({ length: 20 }).default('text').notNull(),
	mediaUrl: text("media_url"),
	amount: numeric(),
	transactionHash: text("transaction_hash"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	isRead: boolean("is_read").default(false),
}, (table) => [
	index("messages_receiver_idx").using("btree", table.receiverId.asc().nullsLast().op("uuid_ops")),
	index("messages_sender_idx").using("btree", table.senderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const eventAttendees = pgTable("event_attendees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	postId: uuid("post_id").notNull(),
	status: varchar({ length: 20 }).default('going').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("event_attendees_post_idx").using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("event_attendees_unique").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.postId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "event_attendees_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "event_attendees_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const postComments = pgTable("post_comments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	postId: uuid("post_id").notNull(),
	userId: uuid("user_id").notNull(),
	mediaUrl: text("media_url").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("post_comments_post_idx").using("btree", table.postId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "post_comments_post_id_posts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "post_comments_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
