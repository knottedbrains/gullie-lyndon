import { pgTable, text, timestamp, uuid, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { moves } from "./moves";
import { housingTypeEnum } from "../enums";

export const housingOptions = pgTable("housing_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  moveId: uuid("move_id").references(() => moves.id).notNull(),
  type: housingTypeEnum("type").notNull(),
  isTemporary: boolean("is_temporary").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state"),
  zipCode: text("zip_code"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  pricePerMonth: decimal("price_per_month", { precision: 10, scale: 2 }),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }),
  commuteToOffice: integer("commute_to_office_minutes"),
  commuteMode: text("commute_mode"),
  parkingAvailable: boolean("parking_available").default(false).notNull(),
  leaseTerms: text("lease_terms"),
  minStay: integer("min_stay_days"),
  availabilityStartDate: timestamp("availability_start_date"),
  availabilityEndDate: timestamp("availability_end_date"),
  neighborhoodRating: text("neighborhood_rating"),
  matchCategory: text("match_category").$type<"optimal" | "strong" | "essential">(),
  selected: boolean("selected").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

