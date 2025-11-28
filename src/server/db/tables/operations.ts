import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { services } from "./services";
import { serviceStatusEnum } from "../enums";

export const policyExceptions = pgTable("policy_exceptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  serviceId: uuid("service_id").references(() => services.id),
  serviceType: text("service_type").notNull(),
  requestedService: text("requested_service").notNull(),
  status: text("status").$type<"pending" | "approved" | "denied">().default("pending").notNull(),
  employerDecision: text("employer_decision"),
  employerDecisionAt: timestamp("employer_decision_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checkIns = pgTable("check_ins", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  serviceId: uuid("service_id").references(() => services.id),
  checkInType: text("check_in_type").$type<"t_minus_48" | "day_of" | "t_plus_48">().notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dspRequests = pgTable("dsp_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  providerName: text("provider_name"),
  isPreferredProvider: boolean("is_preferred_provider").default(false).notNull(),
  arrivalDate: timestamp("arrival_date"),
  familySize: integer("family_size"),
  householdComposition: jsonb("household_composition").$type<Record<string, unknown>>(),
  desiredNeighborhoods: jsonb("desired_neighborhoods").$type<string[]>().default([]),
  schoolNeeds: jsonb("school_needs").$type<string[]>().default([]),
  constraints: jsonb("constraints").$type<{
    budget?: number;
    hasCar?: boolean;
    commutingExpectations?: string;
  }>(),
  status: serviceStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

