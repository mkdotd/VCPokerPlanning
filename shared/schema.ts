import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  moderatorId: text("moderator_id").notNull(),
  currentStory: text("current_story"),
  currentStoryTitle: text("current_story_title"),
  isRevealed: boolean("is_revealed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const participants = pgTable("participants", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  name: text("name").notNull(),
  isModerator: boolean("is_moderator").default(false),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  roomId: text("room_id").notNull(),
  participantId: text("participant_id").notNull(),
  value: text("value").notNull(), // can be fibonacci number or 'pass'
  round: integer("round").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  createdAt: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  joinedAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export type Room = typeof rooms.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;

// Additional types for API responses
export type RoomWithParticipants = Room & {
  participants: Participant[];
  votes: Vote[];
};

export type VoteResult = {
  participantId: string;
  participantName: string;
  value: string;
};

export type RoomResults = {
  average: number;
  participants: number;
  consensus: string;
  votes: VoteResult[];
};
