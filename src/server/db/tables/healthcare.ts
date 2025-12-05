import { pgTable, text, timestamp, uuid, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { insuranceTypeEnum } from "../enums";

export const healthcare = pgTable("healthcare", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),

  // Insurance coverage
  insuranceType: insuranceTypeEnum("insurance_type").notNull(),
  insuranceProvider: text("insurance_provider"),
  policyNumber: text("policy_number"),
  coverageStartDate: date("coverage_start_date"),
  coverageEndDate: date("coverage_end_date"),

  // Insurance enrollment
  enrollmentRequired: boolean("enrollment_required").default(false).notNull(),
  enrollmentCompleted: boolean("enrollment_completed").default(false).notNull(),
  enrollmentDeadline: date("enrollment_deadline"),

  // Family coverage
  includeFamily: boolean("include_family").default(false).notNull(),
  familyMembers: jsonb("family_members").$type<Array<{
    name: string;
    relationship: string;
    dateOfBirth?: string;
  }>>(),

  // Medical records transfer
  medicalRecordsTransferRequired: boolean("medical_records_transfer_required").default(false).notNull(),
  medicalRecordsRequested: boolean("medical_records_requested").default(false).notNull(),
  medicalRecordsReceived: boolean("medical_records_received").default(false).notNull(),
  previousProvider: text("previous_provider"),

  // Healthcare providers
  primaryCarePhysician: text("primary_care_physician"),
  primaryCareClinic: text("primary_care_clinic"),
  primaryCareAddress: text("primary_care_address"),
  primaryCarePhone: text("primary_care_phone"),
  primaryCareAppointmentDate: date("primary_care_appointment_date"),

  // Specialists
  specialists: jsonb("specialists").$type<Array<{
    type: string; // e.g., "dentist", "optometrist", "pediatrician"
    name?: string;
    clinic?: string;
    phone?: string;
    appointmentDate?: string;
  }>>(),

  // Prescriptions
  prescriptionsNeeded: boolean("prescriptions_needed").default(false).notNull(),
  prescriptions: jsonb("prescriptions").$type<Array<{
    medication: string;
    dosage?: string;
    prescribedBy?: string;
    transferredToNewPharmacy?: boolean;
  }>>(),
  preferredPharmacy: text("preferred_pharmacy"),
  pharmacyAddress: text("pharmacy_address"),

  // Emergency info
  emergencyContact: text("emergency_contact"),
  emergencyContactPhone: text("emergency_contact_phone"),
  bloodType: text("blood_type"),
  allergies: jsonb("allergies").$type<string[]>(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
