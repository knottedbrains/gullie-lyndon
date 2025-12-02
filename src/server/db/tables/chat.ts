import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id),
  title: text("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  agentMailInboxId: text("agent_mail_inbox_id"),
  agentMailEmailAddress: text("agent_mail_email_address"),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls").$type<
    Array<{
      name: string;
      arguments: Record<string, unknown>;
      result?: string;
    }>
  >(),
  metadata: jsonb("metadata").$type<{
    isEmail?: boolean;
    emailFrom?: string;
    emailTo?: string[];
    emailCc?: string[];
    emailBcc?: string[]; // Added
    emailSubject?: string;
    emailId?: string; // Added
    emailBody?: string; // Added text body
    emailHtml?: string; // Added html body
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

