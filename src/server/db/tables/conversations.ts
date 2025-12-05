import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { moves } from "./moves";
import { users } from "./users";
import { conversationTypeEnum, conversationStatusEnum, conversationVisibilityEnum } from "../enums";

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id")
    .notNull()
    .references(() => moves.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New Conversation"),
  type: conversationTypeEnum("type").default("general").notNull(),
  status: conversationStatusEnum("status").default("active").notNull(),
  visibility: conversationVisibilityEnum("visibility").default("shared").notNull(),
  createdBy: text("created_by").references(() => users.id),
  agentMailInboxId: text("agent_mail_inbox_id"),
  agentMailEmailAddress: text("agent_mail_email_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  move: one(moves, {
    fields: [conversations.moveId],
    references: [moves.id],
  }),
  createdByUser: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
  }),
  participants: many(conversationParticipants),
  messages: many(messages),
}));

// Import types for relations (defined below)
import { conversationParticipants } from "./conversation-participants";
import { messages } from "./messages";
