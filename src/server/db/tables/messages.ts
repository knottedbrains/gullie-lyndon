import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { conversations } from "./conversations";
import { users } from "./users";
import { authorTypeEnum } from "../enums";

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  authorId: text("author_id").references(() => users.id, { onDelete: "set null" }), // Nullable for AI
  authorType: authorTypeEnum("author_type").default("user").notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls").$type<
    Array<{
      name: string;
      arguments: Record<string, unknown>;
      result?: string;
    }>
  >(),
  reasoning: text("reasoning"), // AI reasoning/thinking (for o1/o3 models)
  model: text("model"), // AI model used for this message
  metadata: jsonb("metadata").$type<{
    isEmail?: boolean;
    emailFrom?: string;
    emailTo?: string[];
    emailCc?: string[];
    emailBcc?: string[];
    emailSubject?: string;
    emailId?: string;
    emailBody?: string;
    emailHtml?: string;
    mentioned?: string[]; // @mentions
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
  }),
}));
