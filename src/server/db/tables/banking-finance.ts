import { pgTable, text, timestamp, uuid, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { accountTypeEnum } from "../enums";

export const bankingFinance = pgTable("banking_finance", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),

  // Account opening
  accountType: accountTypeEnum("account_type").notNull(),
  bankName: text("bank_name"),
  branchLocation: text("branch_location"),
  accountOpenDate: date("account_open_date"),
  accountNumber: text("account_number"),

  // Status tracking
  accountOpened: boolean("account_opened").default(false).notNull(),
  debitCardIssued: boolean("debit_card_issued").default(false).notNull(),
  onlineBankingSetup: boolean("online_banking_setup").default(false).notNull(),

  // Required documents
  documentsRequired: jsonb("documents_required").$type<string[]>(),
  documentsSubmitted: jsonb("documents_submitted").$type<string[]>(),

  // Tax IDs
  taxIdRequired: boolean("tax_id_required").default(false).notNull(),
  taxIdType: text("tax_id_type"), // e.g., "SSN", "TIN", "EIN", "National Insurance Number"
  taxIdNumber: text("tax_id_number"),
  taxIdApplicationDate: date("tax_id_application_date"),
  taxIdReceived: boolean("tax_id_received").default(false).notNull(),

  // Payroll routing
  payrollRoutingSetup: boolean("payroll_routing_setup").default(false).notNull(),
  payrollEffectiveDate: date("payroll_effective_date"),
  directDepositForm: text("direct_deposit_form_url"),

  // International transfers
  internationalTransferSetup: boolean("international_transfer_setup").default(false).notNull(),
  swiftCode: text("swift_code"),
  iban: text("iban"),

  // Credit
  creditCheckRequired: boolean("credit_check_required").default(false).notNull(),
  creditCheckCompleted: boolean("credit_check_completed").default(false).notNull(),
  creditCardApplied: boolean("credit_card_applied").default(false).notNull(),
  creditCardIssued: boolean("credit_card_issued").default(false).notNull(),

  // Meetings and support
  bankAppointmentScheduled: boolean("bank_appointment_scheduled").default(false).notNull(),
  appointmentDate: date("appointment_date"),
  bankRepresentative: text("bank_representative"),
  bankRepContact: text("bank_rep_contact"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
