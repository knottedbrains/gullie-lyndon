import { pgTable, text, timestamp, uuid, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { employers } from "./core";

export const policies = pgTable("policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  employerId: uuid("employer_id").references(() => employers.id).notNull(),
  hasFormalPolicy: boolean("has_formal_policy").default(false).notNull(),
  maxTemporaryHousingBudget: decimal("max_temporary_housing_budget", { precision: 10, scale: 2 }),
  maxHousingBudget: decimal("max_housing_budget", { precision: 10, scale: 2 }),
  overallRelocationBudget: decimal("overall_relocation_budget", { precision: 10, scale: 2 }),
  coveredServices: jsonb("covered_services").$type<string[]>().default([]),
  requiresApprovalForAll: boolean("requires_approval_for_all").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

