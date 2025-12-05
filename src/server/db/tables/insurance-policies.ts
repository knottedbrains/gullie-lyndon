import { pgTable, text, timestamp, uuid, boolean, decimal, date, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { insurancePolicyTypeEnum } from "../enums";

export const insurancePolicies = pgTable("insurance_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),

  // Policy details
  policyType: insurancePolicyTypeEnum("policy_type").notNull(),
  provider: text("provider"),
  policyNumber: text("policy_number"),

  // Coverage period
  coverageStartDate: date("coverage_start_date"),
  coverageEndDate: date("coverage_end_date"),

  // Financial details
  premium: decimal("premium", { precision: 10, scale: 2 }),
  premiumFrequency: text("premium_frequency"), // e.g., "monthly", "annual"
  deductible: decimal("deductible", { precision: 10, scale: 2 }),
  coverageAmount: decimal("coverage_amount", { precision: 12, scale: 2 }),

  // Status tracking
  quoteRequested: boolean("quote_requested").default(false).notNull(),
  quoteReceived: boolean("quote_received").default(false).notNull(),
  applicationSubmitted: boolean("application_submitted").default(false).notNull(),
  policyIssued: boolean("policy_issued").default(false).notNull(),
  policyActive: boolean("policy_active").default(false).notNull(),

  // Property/Auto specific details (when applicable)
  propertyAddress: text("property_address"), // For property/renters insurance
  vehicleDetails: jsonb("vehicle_details").$type<{
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    licensePlate?: string;
  }>(), // For auto insurance

  // Beneficiaries (for life insurance)
  beneficiaries: jsonb("beneficiaries").$type<Array<{
    name: string;
    relationship: string;
    percentage: number;
  }>>(),

  // Coverage details
  coverageDetails: jsonb("coverage_details").$type<Record<string, unknown>>(),

  // Previous insurance (for transfer/cancellation)
  previousProvider: text("previous_provider"),
  previousPolicyNumber: text("previous_policy_number"),
  previousPolicyCancelled: boolean("previous_policy_cancelled").default(false).notNull(),
  cancellationDate: date("cancellation_date"),

  // Agent information
  agentName: text("agent_name"),
  agentContact: text("agent_contact"),
  agentEmail: text("agent_email"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
