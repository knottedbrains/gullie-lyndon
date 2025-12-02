import { pgTable, text, timestamp, uuid, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { employees } from "./core";
import { employers } from "./core";
import { policies } from "./policies";
import { moveStatusEnum } from "../enums";

export const moves = pgTable("moves", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  employerId: uuid("employer_id").references(() => employers.id).notNull(),
  policyId: uuid("policy_id").references(() => policies.id),
  originCity: text("origin_city").notNull(),
  destinationCity: text("destination_city").notNull(),
  officeLocation: text("office_location").notNull(),
  programType: text("program_type"),
  benefitAmount: decimal("benefit_amount", { precision: 10, scale: 2 }),
  status: moveStatusEnum("status").default("initiated").notNull(),
  lifestyleIntakeCompleted: boolean("lifestyle_intake_completed").default(false).notNull(),
  householdComposition: jsonb("household_composition").$type<{
    relocatingAlone: boolean;
    spousePartner?: string;
    familyMembers?: string[];
  }>(),
  housingPreferences: jsonb("housing_preferences").$type<{
    requiredCriteria: string[];
    niceToHaveCriteria: string[];
    neighborhoodPreferences: string[];
    hobbies: string[];
    walkability: boolean;
    urbanRural: "urban" | "rural" | "suburban";
    commuteDistance: number;
  }>(),
  moveDate: timestamp("move_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const movesRelations = relations(moves, ({ one }) => ({
  employee: one(employees, {
    fields: [moves.employeeId],
    references: [employees.id],
  }),
  employer: one(employers, {
    fields: [moves.employerId],
    references: [employers.id],
  }),
  policy: one(policies, {
    fields: [moves.policyId],
    references: [policies.id],
  }),
}));
