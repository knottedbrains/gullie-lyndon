import { pgTable, text, timestamp, uuid, boolean, integer, decimal, date, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { gradeLevelEnum, schoolTypeEnum, enrollmentStatusEnum } from "../enums";

export const childrenEducation = pgTable("children_education", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),

  // Child details
  childName: text("child_name").notNull(),
  age: integer("age").notNull(),
  gradeLevel: gradeLevelEnum("grade_level").notNull(),
  currentSchool: text("current_school"),

  // School search preferences
  preferredSchoolType: schoolTypeEnum("preferred_school_type"),
  desiredNeighborhoods: jsonb("desired_neighborhoods").$type<string[]>(),
  specialNeeds: text("special_needs"),
  languageRequirements: text("language_requirements"),
  extracurricularPreferences: jsonb("extracurricular_preferences").$type<string[]>(),

  // School applications
  schoolsResearched: jsonb("schools_researched").$type<Array<{
    name: string;
    type: string;
    address?: string;
    tuition?: string;
    rating?: string;
  }>>(),

  schoolsApplied: jsonb("schools_applied").$type<Array<{
    name: string;
    applicationDate: string;
    status: string;
    interviewDate?: string;
    decisionDate?: string;
  }>>(),

  // Enrollment details
  enrollmentStatus: enrollmentStatusEnum("enrollment_status").default("researching").notNull(),
  selectedSchool: text("selected_school"),
  enrollmentDate: date("enrollment_date"),
  tuition: decimal("tuition", { precision: 10, scale: 2 }),

  // Support services
  needsTransportation: boolean("needs_transportation").default(false).notNull(),
  needsBeforeAfterCare: boolean("needs_before_after_care").default(false).notNull(),

  // Transfer of records
  recordsRequested: boolean("records_requested").default(false).notNull(),
  recordsReceived: boolean("records_received").default(false).notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
