import { pgTable, text, timestamp, uuid, boolean, jsonb, date } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { visaTypeEnum, visaStatusEnum } from "../enums";

export const immigrationVisas = pgTable("immigration_visas", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  visaType: visaTypeEnum("visa_type").notNull(),
  status: visaStatusEnum("status").default("not_started").notNull(),
  country: text("country").notNull(),

  // Primary applicant details
  applicantName: text("applicant_name").notNull(),
  applicantPassportNumber: text("applicant_passport_number"),

  // Application details
  applicationDate: date("application_date"),
  approvalDate: date("approval_date"),
  expirationDate: date("expiration_date"),

  // Legal support
  lawyerName: text("lawyer_name"),
  lawyerFirm: text("lawyer_firm"),
  lawyerContact: text("lawyer_contact"),

  // Documents tracking
  documentsRequired: jsonb("documents_required").$type<string[]>(),
  documentsSubmitted: jsonb("documents_submitted").$type<string[]>(),

  // Dependents
  includeDependents: boolean("include_dependents").default(false).notNull(),
  dependents: jsonb("dependents").$type<Array<{
    name: string;
    relationship: string;
    passportNumber?: string;
    visaType?: string;
    status?: string;
  }>>(),

  // Additional info
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
