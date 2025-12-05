import { pgEnum } from "drizzle-orm/pg-core";

export const moveStatusEnum = pgEnum("move_status", [
  "initiated",
  "intake_in_progress",
  "housing_search",
  "services_booked",
  "in_transit",
  "completed",
  "cancelled",
]);

export const serviceTypeEnum = pgEnum("service_type", [
  "temporary_housing",
  "permanent_housing",
  "hhg",
  "car_shipment",
  "flight",
  "dsp_orientation",
  "immigration_visa",
  "children_education",
  "pet_relocation",
  "banking_finance",
  "healthcare",
  "insurance",
  "other",
]);

export const serviceStatusEnum = pgEnum("service_status", [
  "pending",
  "quoted",
  "approved",
  "booked",
  "in_progress",
  "completed",
  "cancelled",
  "exception",
]);

export const housingTypeEnum = pgEnum("housing_type", [
  "hotel",
  "serviced_apartment",
  "airbnb",
  "apartment",
  "condo",
  "single_family_home",
]);

export const policyCoverageEnum = pgEnum("policy_coverage", [
  "covered",
  "not_covered",
  "requires_approval",
]);

export const userRoleEnum = pgEnum("user_role", [
  "employee",
  "company",
  "vendor",
  "admin",
]);

// Conversation enums
export const conversationTypeEnum = pgEnum("conversation_type", [
  "housing",
  "moving",
  "services",
  "budget",
  "general",
  "vendor",
  "internal",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "archived",
  "closed",
]);

export const participantTypeEnum = pgEnum("participant_type", [
  "employee",
  "admin",
  "vendor",
  "ai",
  "system",
]);

export const participantRoleEnum = pgEnum("participant_role", [
  "owner",
  "participant",
  "observer",
]);

export const authorTypeEnum = pgEnum("author_type", [
  "user",
  "ai",
  "system",
]);

export const conversationVisibilityEnum = pgEnum("conversation_visibility", [
  "private",    // Only invited participants
  "internal",   // All company staff (admins + employees)
  "shared",     // Invited participants + move stakeholders
]);

// Immigration & Visa enums
export const visaTypeEnum = pgEnum("visa_type", [
  "h1b",
  "l1",
  "e2",
  "o1",
  "tn",
  "green_card",
  "work_permit",
  "dependent_visa",
  "other",
]);

export const visaStatusEnum = pgEnum("visa_status", [
  "not_started",
  "documents_gathering",
  "application_submitted",
  "pending_approval",
  "approved",
  "rejected",
  "expired",
]);

// Children & Education enums
export const gradeLevelEnum = pgEnum("grade_level", [
  "preschool",
  "kindergarten",
  "elementary",
  "middle_school",
  "high_school",
]);

export const schoolTypeEnum = pgEnum("school_type", [
  "public",
  "private",
  "international",
  "montessori",
  "waldorf",
  "charter",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "researching",
  "applied",
  "waitlisted",
  "accepted",
  "enrolled",
  "declined",
]);

// Pet enums
export const petTypeEnum = pgEnum("pet_type", [
  "dog",
  "cat",
  "bird",
  "reptile",
  "small_mammal",
  "other",
]);

// Banking enums
export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "investment",
  "credit_card",
]);

// Healthcare enums
export const insuranceTypeEnum = pgEnum("insurance_type", [
  "health",
  "dental",
  "vision",
  "disability",
  "life",
]);

// Insurance policy enums
export const insurancePolicyTypeEnum = pgEnum("insurance_policy_type", [
  "property",
  "renters",
  "auto",
  "health",
  "life",
  "disability",
  "umbrella",
]);
