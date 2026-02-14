import { relations } from "drizzle-orm/relations";
import { users, friendships, invites, posts, reactions, postStacks, messages, eventAttendees, postComments } from "./schema";

export const friendshipsRelations = relations(friendships, ({one}) => ({
	user_userId1: one(users, {
		fields: [friendships.userId1],
		references: [users.id],
		relationName: "friendships_userId1_users_id"
	}),
	user_userId2: one(users, {
		fields: [friendships.userId2],
		references: [users.id],
		relationName: "friendships_userId2_users_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	friendships_userId1: many(friendships, {
		relationName: "friendships_userId1_users_id"
	}),
	friendships_userId2: many(friendships, {
		relationName: "friendships_userId2_users_id"
	}),
	invites: many(invites),
	reactions: many(reactions),
	posts_targetUserId: many(posts, {
		relationName: "posts_targetUserId_users_id"
	}),
	posts_userId: many(posts, {
		relationName: "posts_userId_users_id"
	}),
	postStacks: many(postStacks),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	eventAttendees: many(eventAttendees),
	postComments: many(postComments),
}));

export const invitesRelations = relations(invites, ({one}) => ({
	user: one(users, {
		fields: [invites.creatorId],
		references: [users.id]
	}),
}));

export const reactionsRelations = relations(reactions, ({one}) => ({
	post: one(posts, {
		fields: [reactions.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [reactions.userId],
		references: [users.id]
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	reactions: many(reactions),
	user_targetUserId: one(users, {
		fields: [posts.targetUserId],
		references: [users.id],
		relationName: "posts_targetUserId_users_id"
	}),
	user_userId: one(users, {
		fields: [posts.userId],
		references: [users.id],
		relationName: "posts_userId_users_id"
	}),
	postStacks: many(postStacks),
	eventAttendees: many(eventAttendees),
	postComments: many(postComments),
}));

export const postStacksRelations = relations(postStacks, ({one}) => ({
	post: one(posts, {
		fields: [postStacks.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postStacks.userId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({one}) => ({
	post: one(posts, {
		fields: [eventAttendees.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [eventAttendees.userId],
		references: [users.id]
	}),
}));

export const postCommentsRelations = relations(postComments, ({one}) => ({
	post: one(posts, {
		fields: [postComments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postComments.userId],
		references: [users.id]
	}),
}));