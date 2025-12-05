import { pgTable, text, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { employers } from "./core";

export const companySettings = pgTable("company_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  employerId: uuid("employer_id").references(() => employers.id).notNull().unique(),

  // Project defaults
  enableBudgetTracking: boolean("enable_budget_tracking").default(true).notNull(),
  requireApprovals: boolean("require_approvals").default(false).notNull(),

  // Conversation defaults
  autoCreateHousingConversation: boolean("auto_create_housing_conversation").default(true).notNull(),
  autoCreateMovingConversation: boolean("auto_create_moving_conversation").default(true).notNull(),
  autoCreateServicesConversation: boolean("auto_create_services_conversation").default(true).notNull(),

  // Additional settings can be stored as JSON for flexibility
  customSettings: jsonb("custom_settings").$type<Record<string, unknown>>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
