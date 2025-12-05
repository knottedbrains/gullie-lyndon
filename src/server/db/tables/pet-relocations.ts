import { pgTable, text, timestamp, uuid, boolean, decimal, date, integer, jsonb } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { petTypeEnum } from "../enums";

export const petRelocations = pgTable("pet_relocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),

  // Pet details
  petName: text("pet_name").notNull(),
  petType: petTypeEnum("pet_type").notNull(),
  breed: text("breed"),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  microchipNumber: text("microchip_number"),

  // Health and veterinary
  veterinarianName: text("veterinarian_name"),
  veterinarianContact: text("veterinarian_contact"),
  vaccinationsUpToDate: boolean("vaccinations_up_to_date").default(false).notNull(),
  healthCertificateDate: date("health_certificate_date"),
  healthCertificateExpiry: date("health_certificate_expiry"),

  // Required documents
  documentsRequired: jsonb("documents_required").$type<string[]>(),
  documentsCompleted: jsonb("documents_completed").$type<string[]>(),

  // Import requirements
  destinationCountry: text("destination_country").notNull(),
  importPermitRequired: boolean("import_permit_required").default(false).notNull(),
  importPermitStatus: text("import_permit_status"),
  importPermitNumber: text("import_permit_number"),

  // Quarantine
  quarantineRequired: boolean("quarantine_required").default(false).notNull(),
  quarantineDuration: integer("quarantine_duration_days"),
  quarantineFacility: text("quarantine_facility"),
  quarantineCost: decimal("quarantine_cost", { precision: 10, scale: 2 }),

  // Transportation
  transportMethod: text("transport_method"), // e.g., "cargo", "cabin", "ground"
  transportCompany: text("transport_company"),
  departureDate: date("departure_date"),
  arrivalDate: date("arrival_date"),
  flightDetails: text("flight_details"),
  transportCost: decimal("transport_cost", { precision: 10, scale: 2 }),

  // Crate/Carrier
  crateRequired: boolean("crate_required").default(false).notNull(),
  crateSize: text("crate_size"),
  crateProvided: boolean("crate_provided").default(false).notNull(),

  // Additional info
  specialInstructions: text("special_instructions"),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
