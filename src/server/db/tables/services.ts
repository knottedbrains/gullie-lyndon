import { pgTable, text, timestamp, uuid, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { vendors } from "./core";
import { serviceTypeEnum, serviceStatusEnum } from "../enums";

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  type: serviceTypeEnum("type").notNull(),
  status: serviceStatusEnum("status").default("pending").notNull(),
  requiresApproval: boolean("requires_approval").default(false).notNull(),
  approved: boolean("approved").default(false).notNull(),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  vendorName: text("vendor_name"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  bookingDate: timestamp("booking_date"),
  serviceDate: timestamp("service_date"),
  serviceBreak: boolean("service_break").default(false).notNull(),
  serviceBreakDescription: text("service_break_description"),
  remediationPlan: text("remediation_plan"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

