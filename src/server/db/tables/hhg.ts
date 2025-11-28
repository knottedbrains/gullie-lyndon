import { pgTable, text, timestamp, uuid, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";

export const hhgQuotes = pgTable("hhg_quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  vendorName: text("vendor_name").notNull(),
  quoteAmount: decimal("quote_amount", { precision: 10, scale: 2 }).notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  withinBudget: boolean("within_budget").notNull(),
  inventory: jsonb("inventory").$type<Record<string, unknown>>(),
  insuranceConfirmed: boolean("insurance_confirmed").default(false).notNull(),
  selected: boolean("selected").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

